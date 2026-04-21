import TmcLog from "../models/TmcLog.js";

export const getMainDataByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const tmcLog = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    if (!tmcLog) {
      return res.status(200).json({
        date,
        totalCalls: 0,
        totalPresentations: 0,
        totalAppointments: 0,
        appointmentsVisited: 0,
        forms: 0,
        revenue: 0
      });
    }

    const totalCalls = tmcLog.calls?.length || 0;
    const totalPresentations = tmcLog.presentations?.length || 0;
    const totalAppointments =
      tmcLog.presentations?.filter(
        (item) => item.status === "Appointment Fixed"
      ).length || 0;

    res.status(200).json({
      date,
      totalCalls,
      totalPresentations,
      totalAppointments,
      appointmentsVisited: tmcLog.appointmentsVisited || 0,
      forms: tmcLog.forms || 0,
      revenue: tmcLog.revenue || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};