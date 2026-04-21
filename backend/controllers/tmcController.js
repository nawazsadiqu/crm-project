import TmcLog from "../models/TmcLog.js";

export const saveTmcLog = async (req, res) => {
  try {
    const {
      date,
      calls,
      presentations,
      appointmentsVisited,
      forms,
      revenue
    } = req.body;

    const existingLog = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    if (existingLog) {
      existingLog.calls = calls;
      existingLog.presentations = presentations;
      existingLog.appointmentsVisited = appointmentsVisited || 0;
      existingLog.forms = forms || 0;
      existingLog.revenue = revenue || 0;
      await existingLog.save();

      return res.status(200).json({
        message: "TMC data updated successfully",
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
      revenue: revenue || 0
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