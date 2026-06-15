import TmcLog from "../models/TmcLog.js";

export const saveTmcLog = async (req, res) => {
  try {
    const {
      date,
      calls,
      presentations,
      appointmentsVisited,
      forms,
      revenue,
      manualNotes
    } = req.body;

    const existingLog = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    if (existingLog) {
  if (Array.isArray(calls) && calls.length < existingLog.calls.length) {
    console.warn(
      `Smaller calls payload received. Existing: ${existingLog.calls.length}, Incoming: ${calls.length}`
    );
  }

  const existingCallNumbers = new Set(
    existingLog.calls.map((call) => call.callNumber)
  );

  const newCalls = Array.isArray(calls)
    ? calls.filter((call) => !existingCallNumbers.has(call.callNumber))
    : [];

  existingLog.calls.push(...newCalls);

  const existingPresentationNumbers = new Set(
    existingLog.presentations.map((p) => p.presentationNumber)
  );

  const newPresentations = Array.isArray(presentations)
    ? presentations.filter(
        (p) => !existingPresentationNumbers.has(p.presentationNumber)
      )
    : [];

  existingLog.presentations.push(...newPresentations);

  existingLog.appointmentsVisited =
    appointmentsVisited ?? existingLog.appointmentsVisited;

  existingLog.forms = forms ?? existingLog.forms;
  existingLog.revenue = revenue ?? existingLog.revenue;
  existingLog.manualNotes = manualNotes ?? existingLog.manualNotes;

  await existingLog.save();

  return res.status(200).json({
    message: "TMC data updated safely",
    data: existingLog
  });
}

    const newLog = await TmcLog.create({
      userId: req.user.id,
      date,
      calls,
      presentations,
      appointmentsVisited: appointmentsVisited || 0,
      forms: forms || 0,
      revenue: revenue || 0,
      manualNotes: manualNotes || ""
    });

    res.status(201).json({
      message: "TMC data saved successfully",
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTmcLogByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const log = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    if (!log) {
      return res.status(200).json({
        calls: [],
        presentations: [],
        appointmentsVisited: 0,
        forms: 0,
        revenue: 0
      });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCallBackPresentations = async (req, res) => {
  try {
    const {
      month = "all",
      weekStart = "",
      weekEnd = ""
    } = req.query;

    const filter = {
      userId: req.user.id,
      "calls.status": "CBP"
    };

    // Week-wise filter
    if (weekStart && weekEnd) {
      filter.date = {
        $gte: weekStart,
        $lte: weekEnd
      };
    }
    // Month-wise filter
    else if (month && month !== "all") {
      filter.date = { $regex: `^${month}` };
    }

    const logs = await TmcLog.find(filter).sort({
      date: -1,
      createdAt: -1
    });

    const records = [];

    logs.forEach((log) => {
      log.calls
        .filter((call) => call.status === "CBP")
        .forEach((call) => {
          records.push({
            _id: `${log._id}-${call.callNumber}`,
            logId: log._id,
            date: log.date,
            callNumber: call.callNumber,
            status: call.status,
            notes: call.notes || ""
          });
        });
    });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCallBackPresentation = async (req, res) => {
  try {
    const { logId, callNumber } = req.params;

    const updatedLog = await TmcLog.findOneAndUpdate(
      {
        _id: logId,
        userId: req.user.id
      },
      {
        $pull: {
          calls: {
            callNumber: Number(callNumber),
            status: "CBP"
          }
        }
      },
      { new: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 

export const updateCallBackPresentationManualNote = async (req, res) => {
  try {
    const { logId, callNumber } = req.params;
    const { manualNote } = req.body;

    const log = await TmcLog.findOne({
      _id: logId,
      userId: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: "TMC log not found" });
    }

    const call = log.calls.find(
      (item) =>
        Number(item.callNumber) === Number(callNumber) &&
        item.status === "CBP"
    );

    if (!call) {
      return res.status(404).json({ message: "Callback presentation not found" });
    }

    const notes = call.notes || "";

    const baseNotes = notes.includes("Manual Note:")
      ? notes.split("Manual Note:")[0].trim()
      : notes.trim();

    call.notes = `${baseNotes}\nManual Note: ${manualNote || ""}`;

    await log.save();

    res.status(200).json({
      message: "Manual note updated successfully",
      notes: call.notes
    });
  } catch (error) {
    console.error("updateCallBackPresentationManualNote error:", error);
    res.status(500).json({ message: error.message });
  }
};