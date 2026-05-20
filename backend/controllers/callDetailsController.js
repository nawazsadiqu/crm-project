import TmcLog from "../models/TmcLog.js";

export const getCallDetailsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const tmcLog = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    const calls = tmcLog?.calls || [];

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

  // old statuses grouped into NA
  NL: "Not Answered",
  B: "Not Answered",
  S: "Not Answered"
};

    const buildStatusData = (statuses) => {
  const grouped = {};

  statuses.forEach((status) => {
    const label = statusLabels[status] || status;

    const matchingCalls = calls
      .filter((item) => item.status === status)
      .map((item) => item.callNumber);

    if (!grouped[label]) {
      grouped[label] = [];
    }

    grouped[label].push(...matchingCalls);
  });

  return Object.entries(grouped).map(([status, callNumbers]) => ({
    status,
    count: callNumbers.length,
    callNumbers: callNumbers.sort((a, b) => a - b)
  }));
};

    const answered = buildStatusData(answeredStatuses);
    const notAnswered = buildStatusData(notAnsweredStatuses);

    const totalAnswered = answered.reduce((sum, item) => sum + item.count, 0);
    const totalNotAnswered = notAnswered.reduce((sum, item) => sum + item.count, 0);
    const totalCalls = calls.length;

    res.status(200).json({
      date,
      answered,
      notAnswered,
      totalAnswered,
      totalNotAnswered,
      totalCalls
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};