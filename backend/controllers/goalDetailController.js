import GoalDetail from "../models/GoalDetail.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import Tmc from "../models/TmcLog.js";

const getWeekRange = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (d) => d.toISOString().split("T")[0];

  return {
    startDate: format(start),
    endDate: format(end)
  };
};

export const getGoalsAndResultsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const savedGoals = await GoalDetail.findOne({
      userId: req.user.id,
      date
    });

    const tmcData = await Tmc.findOne({
      userId: req.user.id,
      date
    });

    const presentations = await PresentationDetail.find({
      userId: req.user.id,
      date
    });

    const forms = await FormDetail.find({
      userId: req.user.id,
      date
    });

    const totalCalls = Array.isArray(tmcData?.calls)
      ? tmcData.calls.filter((item) => item.status).length
      : 0;

    const totalPresentations = presentations.length;

    const totalAppointmentFixing = presentations.filter(
      (item) => item.isAppointment
    ).length;

    const totalAppointmentVisiting = presentations.filter(
      (item) => item.isVisitedAppointment
    ).length;

    const totalForms = forms.length;

    const totalRevenue = forms.reduce(
      (sum, item) => sum + Number(item.exGst  || 0),
      0
    );

    const { startDate, endDate } = getWeekRange(date);

    // WEEKLY DATA
    const weeklyTmc = await Tmc.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const weeklyPresentations = await PresentationDetail.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const weeklyForms = await FormDetail.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const weeklyCalls = weeklyTmc.reduce(
      (sum, item) =>
        sum +
        (Array.isArray(item.calls)
          ? item.calls.filter((c) => c.status).length
          : 0),
      0
    );

    const weeklyPresentationsCount = weeklyPresentations.length;

    const weeklyAppointmentFixing = weeklyPresentations.filter(
      (item) => item.isAppointment
    ).length;

    const weeklyAppointmentVisiting = weeklyPresentations.filter(
      (item) => item.isVisitedAppointment
    ).length;

    const weeklyFormsCount = weeklyForms.length;

    const weeklyRevenue = weeklyForms.reduce(
      (sum, item) => sum + Number(item.exGst || 0),
      0
    );

    // MONTHLY RANGE
    const monthStart = date.slice(0, 7); // YYYY-MM

    const monthlyTmc = await Tmc.find({
      userId: req.user.id,
      date: { $regex: `^${monthStart}` }
    });

    const monthlyPresentations = await PresentationDetail.find({
      userId: req.user.id,
      date: { $regex: `^${monthStart}` }
    });

    const monthlyForms = await FormDetail.find({
      userId: req.user.id,
      date: { $regex: `^${monthStart}` }
    });

    const monthlyCalls = monthlyTmc.reduce(
      (sum, item) =>
       sum +
        (Array.isArray(item.calls)
          ? item.calls.filter((c) => c.status).length
          : 0),
      0
    );

    const monthlyPresentationsCount = monthlyPresentations.length;

    const monthlyAppointmentFixing = monthlyPresentations.filter(
      (item) => item.isAppointment
    ).length;

    const monthlyAppointmentVisiting = monthlyPresentations.filter(
      (item) => item.isVisitedAppointment
    ).length;

    const monthlyFormsCount = monthlyForms.length;

    const monthlyRevenue = monthlyForms.reduce(
      (sum, item) => sum + Number(item.exGst || 0),
      0
    );

    res.status(200).json({
  dailyGoals: {
    calls: savedGoals?.dailyCallsGoal || 0,
    presentations: savedGoals?.dailyPresentationsGoal || 0,
    appointmentFixing: savedGoals?.appointmentFixingGoal || 0,
    appointmentVisiting: savedGoals?.appointmentVisitingGoal || 0,
    forms: savedGoals?.formsGoal || 0,
    revenue: savedGoals?.revenueGoal || 0
  },

  weeklyGoals: {
    calls: savedGoals?.weeklyCallsGoal || 0,
    presentations: savedGoals?.weeklyPresentationsGoal || 0,
    appointmentFixing: savedGoals?.weeklyAppointmentFixingGoal || 0,
    appointmentVisiting: savedGoals?.weeklyAppointmentVisitingGoal || 0,
    forms: savedGoals?.weeklyFormsGoal || 0,
    revenue: savedGoals?.weeklyRevenueGoal || 0
  },

  monthlyGoals: {
    calls: savedGoals?.monthlyCallsGoal || 0,
    presentations: savedGoals?.monthlyPresentationsGoal || 0,
    appointmentFixing: savedGoals?.monthlyAppointmentFixingGoal || 0,
    appointmentVisiting: savedGoals?.monthlyAppointmentVisitingGoal || 0,
    forms: savedGoals?.monthlyFormsGoal || 0,
    revenue: savedGoals?.monthlyRevenueGoal || 0
  },

  results: {
    calls: totalCalls,
    presentations: totalPresentations,
    appointmentFixing: totalAppointmentFixing,
    appointmentVisiting: totalAppointmentVisiting,
    forms: totalForms,
    revenue: totalRevenue
  },

  weeklyResults: {
    calls: weeklyCalls,
    presentations: weeklyPresentationsCount,
    appointmentFixing: weeklyAppointmentFixing,
    appointmentVisiting: weeklyAppointmentVisiting,
    forms: weeklyFormsCount,
    revenue: weeklyRevenue
  },

  monthlyResults: {
    calls: monthlyCalls,
    presentations: monthlyPresentationsCount,
    appointmentFixing: monthlyAppointmentFixing,
    appointmentVisiting: monthlyAppointmentVisiting,
    forms: monthlyFormsCount,
    revenue: monthlyRevenue
  },

  weekInfo: {
    startDate,
    endDate
  }
});
  } catch (error) {
    console.error("getGoalsAndResultsByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveGoalsByDate = async (req, res) => {
  try {
    const {
      date,

      dailyCallsGoal,
      dailyPresentationsGoal,
      appointmentFixingGoal,
      appointmentVisitingGoal,
      formsGoal,
      revenueGoal,

      weeklyCallsGoal,
      weeklyPresentationsGoal,
      weeklyAppointmentFixingGoal,
      weeklyAppointmentVisitingGoal,
      weeklyFormsGoal,
      weeklyRevenueGoal,

      monthlyCallsGoal,
      monthlyPresentationsGoal,
      monthlyAppointmentFixingGoal,
      monthlyAppointmentVisitingGoal,
      monthlyFormsGoal,
      monthlyRevenueGoal
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const updatedGoal = await GoalDetail.findOneAndUpdate(
      {
        userId: req.user.id,
        date
      },
      {
        dailyCallsGoal: Number(dailyCallsGoal || 0),
        dailyPresentationsGoal: Number(dailyPresentationsGoal || 0),
        appointmentFixingGoal: Number(appointmentFixingGoal || 0),
        appointmentVisitingGoal: Number(appointmentVisitingGoal || 0),
        formsGoal: Number(formsGoal || 0),
        revenueGoal: Number(revenueGoal || 0),

        weeklyCallsGoal: Number(weeklyCallsGoal || 0),
        weeklyPresentationsGoal: Number(weeklyPresentationsGoal || 0),
        weeklyAppointmentFixingGoal: Number(weeklyAppointmentFixingGoal || 0),
        weeklyAppointmentVisitingGoal: Number(weeklyAppointmentVisitingGoal || 0),
        weeklyFormsGoal: Number(weeklyFormsGoal || 0),
        weeklyRevenueGoal: Number(weeklyRevenueGoal || 0),

        monthlyCallsGoal: Number(monthlyCallsGoal || 0),
        monthlyPresentationsGoal: Number(monthlyPresentationsGoal || 0),
        monthlyAppointmentFixingGoal: Number(monthlyAppointmentFixingGoal || 0),
        monthlyAppointmentVisitingGoal: Number(monthlyAppointmentVisitingGoal || 0),
        monthlyFormsGoal: Number(monthlyFormsGoal || 0),
        monthlyRevenueGoal: Number(monthlyRevenueGoal || 0)
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json({
      message: "Goals saved successfully",
      data: updatedGoal
    });
  } catch (error) {
    console.error("saveGoalsByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};