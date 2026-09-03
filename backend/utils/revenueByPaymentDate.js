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
  allTime = false
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
  formFilter.userId =
    userId;
}

if (!allTime) {
  formFilter.$or = [
    {
      date:
        dateFilter
    },
    {
      "paymentHistory.paymentDate":
        dateFilter
    }
  ];
}

const forms =
  await FormDetail.find(
    formFilter
  )
    .select("date revenue amountReceivedNow paymentHistory")
    .lean();

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
      formRevenue += amountToExGst(firstPaymentAmount);
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
        formRevenue += amountToExGst(payment.amount || 0);
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
  allTime = false
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
  formFilter.userId =
    userId;
}

if (!allTime) {
  formFilter.$or = [
    {
      date:
        dateFilter
    },
    {
      "paymentHistory.paymentDate":
        dateFilter
    }
  ];
}

const forms =
  await FormDetail.find(
    formFilter
  )
    .select(
      "date businessName contact contactNumber phoneNumber mobileNumber number mapLink googleMapLink locationLink revenue amountReceivedNow paymentHistory serviceCategory googleServices googleServicesOther otherServices otherServicesOther"
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

  const createPaymentDetail = (form, amount, paymentDate, source) => {
    const revenueAmount = cleanNumber(amount);
    const exGstAmount = amountToExGst(revenueAmount);
    const profitSharingAmount = Number(
      (exGstAmount * getProfitRate(form)).toFixed(2)
    );

    return {
      _id: `${form._id}-${source}-${paymentDate}`,
      formId: form._id,
      date: paymentDate,

      businessName: form.businessName || "",
      contact: form.contact || "",
      contactNumber: form.contactNumber || "",
      phoneNumber: form.phoneNumber || "",
      mobileNumber: form.mobileNumber || "",
      number: form.number || "",

      mapLink: form.mapLink || "",
      googleMapLink: form.googleMapLink || "",
      locationLink: form.locationLink || "",

      googleServices: form.googleServices || [],
      googleServicesOther: form.googleServicesOther || "",
      otherServices: form.otherServices || [],
      otherServicesOther: form.otherServicesOther || "",

      revenue: revenueAmount,
      exGst: exGstAmount,
      profitSharing: profitSharingAmount,
      paymentSource: source
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