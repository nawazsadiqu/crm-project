import FormDetail from "../models/FormDetail.js";

const cleanNumber = (value) => {
  if (value === undefined || value === null) return 0;

  return (
    Number(
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .trim()
    ) || 0
  );
};

const amountToExGst = (amount) => {
  return Number((cleanNumber(amount) / 1.18).toFixed(2));
};

const getMongoDateFilter = ({
  exactDate = "",
  startDate = "",
  endDate = "",
  monthPrefix = "",
  yearPrefix = ""
}) => {
  if (exactDate) return exactDate;

  if (startDate && endDate) {
    return {
      $gte: startDate,
      $lte: endDate
    };
  }

  if (monthPrefix) {
    return {
      $regex: `^${monthPrefix}`
    };
  }

  if (yearPrefix) {
    return {
      $regex: `^${yearPrefix}`
    };
  }

  return null;
};

const isDateMatching = (
  dateValue,
  {
    exactDate = "",
    startDate = "",
    endDate = "",
    monthPrefix = "",
    yearPrefix = "",
    allTime = false
  }
) => {
  if (allTime) {
    return true;
  }

  const date = String(
    dateValue || ""
  ).trim();

  if (!date) {
    return false;
  }

  if (exactDate) {
    return date === exactDate;
  }

  if (startDate && endDate) {
    return (
      date >= startDate &&
      date <= endDate
    );
  }

  if (monthPrefix) {
    return date.startsWith(
      monthPrefix
    );
  }

  if (yearPrefix) {
    return date.startsWith(
      yearPrefix
    );
  }

  return false;
};

export const getRevenueByPaymentDate = async ({
  userId = "",
  exactDate = "",
  startDate = "",
  endDate = "",
  monthPrefix = "",
  yearPrefix = "",
  allTime = false,
  creditRole = "",
  useRevenueCredit = false
}) => {
  const dateFilter = getMongoDateFilter({
    exactDate,
    startDate,
    endDate,
    monthPrefix,
    yearPrefix
  });

  if (
    !dateFilter &&
    !allTime
  ) {
    return 0;
  }

  const formFilter = {};

  if (userId) {
    if (
      useRevenueCredit &&
      creditRole === "telecaller"
    ) {
      /*
        Telecaller:
        Count only Telecaller-owned forms.
      */
      formFilter.$and = [
        {
          userId
        },
        {
          dealSource: "telecaller"
        }
      ];
    } else if (
      useRevenueCredit &&
      creditRole === "ba"
    ) {
      /*
        BA revenue performance:

        1. BA's own normal deals = 100%

        2. Telecaller deals closed by this BA
           = 50%

        Telecaller form itself still belongs
        to the Telecaller.
      */
      formFilter.$and = [
        {
          $or: [
            {
              userId,
              dealSource: {
                $ne: "telecaller"
              }
            },
            {
              dealSource: "telecaller",
              closedByBaId: userId
            }
          ]
        }
      ];
    } else {
      /*
        Normal/default callers keep
        the original ownership behaviour.
      */
      formFilter.userId = userId;
    }
  }

  if (!allTime) {
    const paymentDateFilter = {
      $or: [
        {
          date: dateFilter
        },
        {
          "paymentHistory.paymentDate":
            dateFilter
        }
      ]
    };

    if (Array.isArray(formFilter.$and)) {
      formFilter.$and.push(
        paymentDateFilter
      );
    } else {
      formFilter.$and = [
        paymentDateFilter
      ];
    }
  }

  const forms =
    await FormDetail.find(
      formFilter
    )
      .select(
        "date revenue amountReceivedNow paymentHistory dealSource fixedByTelecallerId closedByBaId baRevenueCredit telecallerRevenueCredit"
      )
      .lean();

  const getCreditedRevenueAmount = (
    amount,
    form
  ) => {
    const amountNumber =
      cleanNumber(amount);

    /*
     * Existing callers of this utility
     * must continue using the old
     * Ex-GST calculation.
     */
    if (!useRevenueCredit) {
      return amountToExGst(
        amountNumber
      );
    }

    /*
 * Telecaller-originated deal:
 * Telecaller receives 100% of
 * collected revenue as performance
 * credit, converted to Ex-GST.
 */
    if (
      creditRole === "telecaller"
    ) {
      if (
        form.dealSource !==
        "telecaller"
      ) {
        return 0;
      }

      return amountToExGst(
        amountNumber
      );
    }

    /*
 * BA performance revenue:
 *
 * Own BA deal = 100% Ex-GST
 *
 * Telecaller-originated deal
 * closed by this BA = 50% Ex-GST
 */
    if (
      creditRole === "ba"
    ) {
      const multiplier =
        form.dealSource ===
          "telecaller"
          ? 0.5
          : 1;

      const creditedAmount =
        amountNumber *
        multiplier;

      return amountToExGst(
        creditedAmount
      );
    }

    return amountToExGst(
      amountNumber
    );
  };

  const totalRevenue = forms.reduce((total, form) => {
    let formRevenue = 0;

    const paymentHistory = Array.isArray(form.paymentHistory)
      ? form.paymentHistory
      : [];

    const paymentHistoryTotal = paymentHistory.reduce((sum, payment) => {
      return sum + cleanNumber(payment.amount || 0);
    }, 0);

    let firstPaymentAmount = cleanNumber(form.amountReceivedNow || 0);

    if (firstPaymentAmount <= 0) {
      const totalReceived = cleanNumber(form.revenue || 0);
      firstPaymentAmount = Math.max(totalReceived - paymentHistoryTotal, 0);
    }

    if (
      isDateMatching(form.date, {
        exactDate,
        startDate,
        endDate,
        monthPrefix,
        yearPrefix,
        allTime,
      })
    ) {
      formRevenue +=
        getCreditedRevenueAmount(
          firstPaymentAmount,
          form
        );
    }

    paymentHistory.forEach((payment) => {
      if (
        isDateMatching(payment.paymentDate, {
          exactDate,
          startDate,
          endDate,
          monthPrefix,
          yearPrefix,
          allTime,
        })
      ) {
        formRevenue +=
          getCreditedRevenueAmount(
            payment.amount || 0,
            form
          );
      }
    });

    return total + formRevenue;
  }, 0);

  return Number(totalRevenue.toFixed(2));
};

export const getRevenueBreakupByPaymentDate = async ({
  userId = "",
  exactDate = "",
  startDate = "",
  endDate = "",
  monthPrefix = "",
  yearPrefix = "",
  allTime = false,
  creditRole = "",
  useRevenueCredit = false
}) => {
  const dateFilter = getMongoDateFilter({
    exactDate,
    startDate,
    endDate,
    monthPrefix,
    yearPrefix
  });

  if (
    !dateFilter &&
    !allTime
  ) {
    return {
      revenue: 0,
      exGst: 0,
      profitSharing: 0,
      details: []
    };
  }

  const formFilter = {};

  if (userId) {

    /*
     * Employee performance filtering.
     *
     * Telecaller:
     * TC-owned forms only.
     *
     * BA:
     * 1. BA's own normal forms.
     * 2. TC-origin forms closed by this BA.
     *
     * Default:
     * Original owner-only behaviour.
     */

    if (
      useRevenueCredit &&
      creditRole === "telecaller"
    ) {

      formFilter.$and = [
        {
          userId
        },
        {
          dealSource: "telecaller"
        }
      ];

    } else if (
      useRevenueCredit &&
      creditRole === "ba"
    ) {

      formFilter.$and = [
        {
          $or: [
            {
              userId,
              dealSource: {
                $ne: "telecaller"
              }
            },
            {
              dealSource: "telecaller",
              closedByBaId: userId
            }
          ]
        }
      ];

    } else {

      formFilter.userId =
        userId;

    }
  }

  if (!allTime) {

    const paymentDateFilter = {
      $or: [
        {
          date:
            dateFilter
        },
        {
          "paymentHistory.paymentDate":
            dateFilter
        }
      ]
    };

    if (
      Array.isArray(
        formFilter.$and
      )
    ) {

      formFilter.$and.push(
        paymentDateFilter
      );

    } else {

      formFilter.$and = [
        paymentDateFilter
      ];

    }
  }

  const forms =
    await FormDetail.find(
      formFilter
    )
      .select(
        "date businessName contact contactNumber phoneNumber mobileNumber number mapLink googleMapLink locationLink revenue amountReceivedNow paymentHistory serviceCategory googleServices googleServicesOther otherServices otherServicesOther dealSource fixedByTelecallerId closedByBaId baRevenueCredit telecallerRevenueCredit"
      )
      .lean();

  const getProfitRate = (form) => {
    const hasGoogleServices =
      Array.isArray(form.googleServices) &&
      form.googleServices.length > 0;

    /*
     * CTS profit-sharing rule:
     *
     * Google Services = 30%
     * Other Services  = 20%
     *
     * If a partial/additional payment
     * later introduces a Google service,
     * the form can contain Google services
     * even if the original category was
     * Other Services.
     */
    if (
      form.serviceCategory === "googleServices" ||
      hasGoogleServices
    ) {
      return 0.30;
    }

    return 0.20;
  };

  const createPaymentDetail = (
    form,
    amount,
    paymentDate,
    source
  ) => {

    const actualRevenueAmount =
      cleanNumber(amount);

    let creditedRevenueAmount =
      actualRevenueAmount;


    /*
     * =================================
     * EMPLOYEE PERFORMANCE CREDIT
     * =================================
     */

    if (useRevenueCredit) {

      /*
       * Telecaller:
       * 100% of TC-origin deal.
       */
      if (
        creditRole === "telecaller"
      ) {

        creditedRevenueAmount =
          form.dealSource === "telecaller"
            ? actualRevenueAmount
            : 0;

      }


      /*
       * BA:
       *
       * Own deal = 100%
       * TC-origin deal closed by BA = 50%
       */
      if (
        creditRole === "ba"
      ) {

        creditedRevenueAmount =
          form.dealSource === "telecaller"
            ? actualRevenueAmount * 0.5
            : actualRevenueAmount;

      }

    }


    const exGstAmount =
      amountToExGst(
        creditedRevenueAmount
      );


    /*
     * Telecaller has no
     * profit sharing.
     */
    const profitSharingAmount =
      useRevenueCredit &&
        creditRole === "telecaller"
        ? 0
        : Number(
          (
            exGstAmount *
            getProfitRate(form)
          ).toFixed(2)
        );


    return {

      _id:
        `${form._id}-${source}-${paymentDate}`,

      formId:
        form._id,

      date:
        paymentDate,

      businessName:
        form.businessName || "",

      contact:
        form.contact || "",

      contactNumber:
        form.contactNumber || "",

      phoneNumber:
        form.phoneNumber || "",

      mobileNumber:
        form.mobileNumber || "",

      number:
        form.number || "",

      mapLink:
        form.mapLink || "",

      googleMapLink:
        form.googleMapLink || "",

      locationLink:
        form.locationLink || "",

      googleServices:
        form.googleServices || [],

      googleServicesOther:
        form.googleServicesOther || "",

      otherServices:
        form.otherServices || [],

      otherServicesOther:
        form.otherServicesOther || "",

      dealSource:
        form.dealSource || "ba",

      closedByBaId:
        form.closedByBaId || null,


      /*
       * Actual payment received by company.
       */
      actualRevenue:
        actualRevenueAmount,


      /*
       * Employee performance credit.
       *
       * BA own deal = 100%
       * BA closing TC deal = 50%
       * TC deal = 100%
       */
      revenue:
        creditedRevenueAmount,

      exGst:
        exGstAmount,

      profitSharing:
        profitSharingAmount,

      paymentSource:
        source

    };
  };

  const details = [];

  forms.forEach((form) => {
    const paymentHistory = Array.isArray(form.paymentHistory)
      ? form.paymentHistory
      : [];

    const paymentHistoryTotal = paymentHistory.reduce((sum, payment) => {
      return sum + cleanNumber(payment.amount || 0);
    }, 0);

    let firstPaymentAmount = cleanNumber(form.amountReceivedNow || 0);

    if (firstPaymentAmount <= 0) {
      const totalReceived = cleanNumber(form.revenue || 0);
      firstPaymentAmount = Math.max(totalReceived - paymentHistoryTotal, 0);
    }

    if (
      firstPaymentAmount > 0 &&
      isDateMatching(form.date, {
        exactDate,
        startDate,
        endDate,
        monthPrefix,
        yearPrefix,
        allTime,
      })
    ) {
      details.push(
        createPaymentDetail(
          form,
          firstPaymentAmount,
          form.date,
          "initial-payment"
        )
      );
    }

    paymentHistory.forEach((payment, index) => {
      if (
        cleanNumber(payment.amount || 0) > 0 &&
        isDateMatching(payment.paymentDate, {
          exactDate,
          startDate,
          endDate,
          monthPrefix,
          yearPrefix,
          allTime,
        })
      ) {
        details.push(
          createPaymentDetail(
            form,
            payment.amount,
            payment.paymentDate,
            `partial-payment-${index + 1}`
          )
        );
      }
    });
  });

  const totals = details.reduce(
    (acc, item) => {
      acc.revenue += Number(item.revenue || 0);
      acc.exGst += Number(item.exGst || 0);
      acc.profitSharing += Number(item.profitSharing || 0);
      return acc;
    },
    {
      revenue: 0,
      exGst: 0,
      profitSharing: 0
    }
  );

  return {
    revenue: Number(totals.revenue.toFixed(2)),
    exGst: Number(totals.exGst.toFixed(2)),
    profitSharing: Number(totals.profitSharing.toFixed(2)),
    details
  };
};