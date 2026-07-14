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
    yearPrefix = ""
  }
) => {
  const date = String(dateValue || "").trim();

  if (!date) return false;

  if (exactDate) return date === exactDate;

  if (startDate && endDate) {
    return date >= startDate && date <= endDate;
  }

  if (monthPrefix) return date.startsWith(monthPrefix);

  if (yearPrefix) return date.startsWith(yearPrefix);

  return false;
};

export const getRevenueByPaymentDate = async ({
  userId,
  exactDate = "",
  startDate = "",
  endDate = "",
  monthPrefix = "",
  yearPrefix = ""
}) => {
  const dateFilter = getMongoDateFilter({
    exactDate,
    startDate,
    endDate,
    monthPrefix,
    yearPrefix
  });

  if (!dateFilter) return 0;

  const forms = await FormDetail.find({
    userId,
    $or: [
      { date: dateFilter },
      { "paymentHistory.paymentDate": dateFilter }
    ]
  })
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
        yearPrefix
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
          yearPrefix
        })
      ) {
        formRevenue += amountToExGst(payment.amount || 0);
      }
    });

    return total + formRevenue;
  }, 0);

  return Number(totalRevenue.toFixed(2));
};