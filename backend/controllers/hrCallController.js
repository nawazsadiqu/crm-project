import HrCallLog from "../models/HrCallLog.js";

export const saveHrCallLog = async (req, res) => {
  try {
    const { date, calls = [] } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const existingLog = await HrCallLog.findOne({
      userId: req.user.id,
      date
    });

    if (existingLog) {
      existingLog.calls = calls;
      await existingLog.save();

      return res.status(200).json({
        message: "HR call data updated successfully",
        data: existingLog
      });
    }

    const newLog = await HrCallLog.create({
      userId: req.user.id,
      date,
      calls
    });

    res.status(201).json({
      message: "HR call data saved successfully",
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHrCallLogByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const log = await HrCallLog.findOne({
      userId: req.user.id,
      date
    });

    if (!log) {
      return res.status(200).json({
        calls: []
      });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHrCallSummary = async (req, res) => {
  try {
    const { date } = req.query;

    const log = await HrCallLog.findOne({
      userId: req.user.id,
      date
    });

    if (!log) {
      return res.json({
        total: 0,
        notConnected: 0,
        answered: 0,
        positive: 0,
        negative: 0,
        followUp: 0
      });
    }

    let summary = {
      total: 0,
      notConnected: 0,
      answered: 0,
      positive: 0,
      negative: 0,
      followUp: 0
    };

    log.calls.forEach((call) => {
      summary.total++;

      const s = call.status;

      if (["NL", "NL_CC", "NL_NC", "B", "CC"].includes(s)) {
        summary.notConnected++;
      }

      if (s.startsWith("ANS")) {
        summary.answered++;
      }

      if (["ANS_RS"].includes(s)) {
        summary.positive++;
      }

      if (["ANS_CC", "ANS_NI", "ANS_NS"].includes(s)) {
        summary.negative++;
      }

      if (["ANS_NW", "ANS_NM", "ANS_CB"].includes(s)) {
        summary.followUp++;
      }
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};