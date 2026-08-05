import HrCallLog from "../models/HrCallLog.js";

const allowedStatuses = [
  "INTERESTED",
  "NOT_INTERESTED",
  "NOT_SELECTED",
  "CALL_BACK",
  "NOT_LIFTING",
  "NOT_CONNECTED",
];

export const saveHrCallLog = async (req, res) => {
  try {
    const { date, call, calls } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    /*
     * Support the new single-call request.
     * The calls array is temporarily supported for older frontend versions.
     */
    const incomingCalls = call
      ? [call]
      : Array.isArray(calls)
      ? calls
      : [];

    if (incomingCalls.length === 0) {
      return res.status(400).json({
        message: "Call data is required",
      });
    }

    const normalizedCalls = [];

    for (const incomingCall of incomingCalls) {
      const callNumber = Number(incomingCall.callNumber);
      const status = incomingCall.status;
      const notes = String(incomingCall.notes || "").trim();

      if (
        !Number.isInteger(callNumber) ||
        callNumber < 1 ||
        callNumber > 150
      ) {
        return res.status(400).json({
          message: "Call number must be between 1 and 150",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid call status",
        });
      }

      normalizedCalls.push({
        callNumber,
        status,
        notes,
      });
    }

    let existingLog = await HrCallLog.findOne({
      userId: req.user.id,
      date,
    });

    if (!existingLog) {
      existingLog = await HrCallLog.create({
        userId: req.user.id,
        date,
        calls: normalizedCalls,
      });

      return res.status(201).json({
        message: "HR call saved successfully",
        data: existingLog,
      });
    }

    /*
     * Preserve every call already stored in MongoDB.
     * Only insert or update the submitted call number.
     */
    const callsByNumber = new Map();

    existingLog.calls.forEach((existingCall) => {
      const plainCall =
        typeof existingCall.toObject === "function"
          ? existingCall.toObject()
          : existingCall;

      callsByNumber.set(
        Number(existingCall.callNumber),
        plainCall
      );
    });

    normalizedCalls.forEach((incomingCall) => {
      const previousCall = callsByNumber.get(
        incomingCall.callNumber
      );

      callsByNumber.set(incomingCall.callNumber, {
        ...(previousCall || {}),
        callNumber: incomingCall.callNumber,
        status: incomingCall.status,
        notes: incomingCall.notes,
      });
    });

    existingLog.calls = Array.from(
      callsByNumber.values()
    ).sort((a, b) => a.callNumber - b.callNumber);

    await existingLog.save();

    res.status(200).json({
      message: "HR call updated successfully",
      data: existingLog,
    });
  } catch (error) {
    console.error("Save HR call error:", error);

    res.status(500).json({
      message: error.message,
    });
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