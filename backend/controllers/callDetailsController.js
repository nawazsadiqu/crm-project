import TmcLog from "../models/TmcLog.js";

const answeredStatuses = [
  "CC",
  "AP",
  "CBP",
  "CBA",
  "NI",
  "CCB",
  "P"
];

const notAnsweredStatuses = [
  "NL",
  "B",
  "NC",
  "S",
  "NA"
];

const statusLabels = {
  AP: "Appointment",
  CBA: "Call Back for Appointment",
  CBP: "Call Back for Presentation",
  CCB: "Customer Call Back",
  NI: "Not Interested",
  CC: "Cut the Call",
  NC: "Not Connected",
  NA: "Not Answered",
  P: "Postponed",

  // old statuses grouped into Not Answered
  NL: "Not Answered",
  B: "Not Answered",
  S: "Not Answered"
};

const formatDate = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRange = (type, dateValue) => {
  const selectedDate = new Date(`${dateValue}T12:00:00`);

  if (type === "weekly") {
    const day = selectedDate.getDay();

    // Monday to Sunday week
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      startDate: formatDate(monday),
      endDate: formatDate(sunday)
    };
  }

  if (type === "monthly") {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(lastDay)
    };
  }

  return {
    startDate: dateValue,
    endDate: dateValue
  };
};

const buildStatusData = (statuses, calls) => {
  const grouped = {};

  statuses.forEach((status) => {
    const label = statusLabels[status] || status;

    const matchingCalls = calls
      .filter((item) => item.status === status)
      .map((item) => item.callNumber)
      .filter((callNumber) => callNumber !== undefined && callNumber !== null);

    if (!grouped[label]) {
      grouped[label] = [];
    }

    grouped[label].push(...matchingCalls);
  });

  return Object.entries(grouped)
    .map(([status, callNumbers]) => ({
      status,
      count: callNumbers.length,
      callNumbers: callNumbers.sort((a, b) => Number(a) - Number(b))
    }))
    .filter((item) => item.count > 0);
};

export const getCallDetailsByDate = async (req, res) => {
  try {
    const { date, type = "daily" } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date is required"
      });
    }

    const { startDate, endDate } = getDateRange(type, date);

    const tmcLogs = await TmcLog.find({
      userId: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const calls = tmcLogs.flatMap((log) =>
      Array.isArray(log.calls) ? log.calls : []
    );

    const answered = buildStatusData(answeredStatuses, calls);
    const notAnswered = buildStatusData(notAnsweredStatuses, calls);

    const totalAnswered = answered.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );

    const totalNotAnswered = notAnswered.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );

    const totalCalls = calls.length;

    res.status(200).json({
      type,
      date,
      startDate,
      endDate,
      answered,
      notAnswered,
      totalAnswered,
      totalNotAnswered,
      totalCalls
    });
  } catch (error) {
    console.error("getCallDetailsByDate error:", error);
    res.status(500).json({
      message: error.message
    });
  }
};