import TmcLog from "../models/TmcLog.js";

export const getCallDetailsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const tmcLog = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    const calls = tmcLog?.calls || [];

    const answeredStatuses = ["CC", "AP", "CBP", "CBA", "NI", "CCB"];
    const notAnsweredStatuses = ["NL", "B", "NC", "S"];

    const buildStatusData = (statuses) => {
      return statuses.map((status) => {
        const matchingCalls = calls
          .filter((item) => item.status === status)
          .map((item) => item.callNumber)
          .sort((a, b) => a - b);

        return {
          status,
          count: matchingCalls.length,
          callNumbers: matchingCalls
        };
      });
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