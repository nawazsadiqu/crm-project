import TmcLog from "../models/TmcLog.js";
import GoalDetail from "../models/GoalDetail.js";
import FormDetail from "../models/FormDetail.js";
import PresentationDetail from "../models/PresentationDetail.js";

const getTodayIST = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
};

const getCurrentMonthIST = () => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
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
    const currentMonth = getCurrentMonthIST();
    const monthlyGoalDate = `${currentMonth}-01`;

    // ==============================
    // FETCH GOALS FROM GOALS PAGE
    // ==============================

    const dailyGoalDoc = await GoalDetail.findOne({
      userId,
      date: today,
      goalType: "daily"
    }).lean();

    const monthlyGoalDoc = await GoalDetail.findOne({
      userId,
      date: monthlyGoalDate,
      goalType: "monthly"
    }).lean();

    // ==============================
    // FETCH TODAY TMC DATA
    // ==============================

    const todayLogs = await TmcLog.find({
      userId,
      date: today
    }).lean();

    const todayCalls = todayLogs.flatMap((log) =>
      Array.isArray(log.calls) ? log.calls : []
    );

    const todayPresentations = todayLogs.flatMap((log) =>
      Array.isArray(log.presentations) ? log.presentations : []
    );

    const dailyCalls = todayCalls.length;
    const dailyPresentations = todayPresentations.length;

    // ==============================
    // DAILY APPOINTMENTS
    // Same logic as Goals page / Admin Performance:
    // Appointment Fixed records from PresentationDetail
    // ==============================

    const dailyAppointments = await PresentationDetail.countDocuments({
      userId,
      date: today,
      isAppointment: true
    });

    // ==============================
    // DAILY FORMS FROM FORM DETAIL
    // ==============================

    const dailyForms = await FormDetail.countDocuments({
      userId,
      date: today
    });

    // ==============================
    // MONTHLY REVENUE FROM FORM DETAIL
    // Same as Admin Performance: exGst
    // ==============================

    const monthlyFormsData = await FormDetail.find({
      userId,
      date: { $regex: `^${currentMonth}` }
    }).lean();

    const monthlyForms = monthlyFormsData.length;

    const monthlyRevenue = monthlyFormsData.reduce((sum, item) => {
      return sum + cleanNumber(item.exGst || item.revenue || 0);
    }, 0);

    res.status(200).json({
      success: true,
      date: today,
      month: currentMonth,

      goals: {
        dailyCallGoal: Number(dailyGoalDoc?.dailyCallsGoal || 0),
        dailyPresentationGoal: Number(dailyGoalDoc?.dailyPresentationsGoal || 0),
        dailyAppointmentGoal: Number(dailyGoalDoc?.appointmentFixingGoal || 0),
        dailyFormsGoal: Number(dailyGoalDoc?.formsGoal || 0),

        monthlyFormsGoal: Number(monthlyGoalDoc?.monthlyFormsGoal || 0),
        monthlyRevenueGoal: Number(monthlyGoalDoc?.monthlyRevenueGoal || 0)
      },

      results: {
        dailyCalls,
        dailyPresentations,
        dailyAppointments,
        dailyForms,

        monthlyForms,
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