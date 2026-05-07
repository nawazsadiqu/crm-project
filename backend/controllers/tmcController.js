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