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
    const { date, type = "daily" } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let startDate = date;
    let endDate = date;

    const selectedDate = new Date(date);

    if (type === "weekly") {
      const day = selectedDate.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;

      const monday = new Date(selectedDate);
      monday.setDate(selectedDate.getDate() + mondayOffset);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      startDate = monday.toISOString().split("T")[0];
      endDate = sunday.toISOString().split("T")[0];
    }

    if (type === "monthly") {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      startDate = firstDay.toISOString().split("T")[0];
      endDate = lastDay.toISOString().split("T")[0];
    }

    const logs = await HrCallLog.find({
      userId: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    let summary = {
      total: 0,
      interested: 0,
      notInterested: 0,
      notSelected: 0,
      callBack: 0,
      notLifting: 0,
      notConnected: 0
    };

    logs.forEach((log) => {
      log.calls.forEach((call) => {
        summary.total++;

        const s = call.status;

        if (s === "INTERESTED") summary.interested++;
if (s === "NOT_INTERESTED") summary.notInterested++;
if (s === "NOT_SELECTED") summary.notSelected++;
if (s === "CALL_BACK") summary.callBack++;
if (s === "NOT_LIFTING") summary.notLifting++;
if (s === "NOT_CONNECTED") summary.notConnected++;
      });
    });

    res.json({
      ...summary,
      type,
      startDate,
      endDate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};