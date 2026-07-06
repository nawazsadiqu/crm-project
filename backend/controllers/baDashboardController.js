import TmcLog from "../models/TmcLog.js";

const DEFAULT_GOALS = {
  dailyCallGoal: 60,
  dailyPresentationGoal: 20,
  dailyAppointmentGoal: 5,
  dailyFormsGoal: 4,
  monthlyRevenueGoal: 100000
};

const getTodayIST = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
};

const getCurrentMonthRangeIST = () => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  const lastDay = new Date(Number(year), Number(month), 0).getDate();

  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`
  };
};

const cleanNumber = (value) => {
  if (value === undefined || value === null) return 0;

  return (
    Number(
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .trim()
    ) || 0
  );
};

export const getBaDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = getTodayIST();
    const { startDate, endDate } = getCurrentMonthRangeIST();

    const todayLogs = await TmcLog.find({
      userId,
      date: today
    }).lean();

    const monthLogs = await TmcLog.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const todayCalls = todayLogs.flatMap((log) =>
      Array.isArray(log.calls) ? log.calls : []
    );

    const todayPresentations = todayLogs.flatMap((log) =>
      Array.isArray(log.presentations) ? log.presentations : []
    );

    const dailyCalls = todayCalls.length;

    const dailyPresentations = todayPresentations.length;

    const dailyAppointments = todayCalls.filter(
      (call) => call.status === "AP"
    ).length;

    const dailyForms = todayLogs.reduce((sum, log) => {
      return sum + cleanNumber(log.forms);
    }, 0);

    const monthlyRevenue = monthLogs.reduce((sum, log) => {
      return sum + cleanNumber(log.revenue);
    }, 0);

    res.status(200).json({
      success: true,
      date: today,
      monthStartDate: startDate,
      monthEndDate: endDate,

      goals: DEFAULT_GOALS,

      results: {
        dailyCalls,
        dailyPresentations,
        dailyAppointments,
        dailyForms,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error("getBaDashboardSummary error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};