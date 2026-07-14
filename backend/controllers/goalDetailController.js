import GoalDetail from "../models/GoalDetail.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import { getRevenueByPaymentDate } from "../utils/revenueByPaymentDate.js";
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

    console.log("GOALS API HIT", req.query);
    const { date, type } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let savedGoals = null;

if (type === "daily") {
  savedGoals = await GoalDetail.findOne({
    userId: req.user.id,
    date,
    goalType: "daily"
  });
}

if (type === "weekly") {
  const { startDate } = getWeekRange(date);

  savedGoals = await GoalDetail.findOne({
    userId: req.user.id,
    date: startDate,
    goalType: "weekly"
  });
}

if (type === "monthly") {
  const monthPrefix = date.slice(0, 7);

  savedGoals = await GoalDetail.findOne({
    userId: req.user.id,
    date: `${monthPrefix}-01`,
    goalType: "monthly"
  });
}

const dailyGoalsData = await GoalDetail.findOne({
  userId: req.user.id,
  date,
  goalType: "daily"
});

// 🔥 ADD THIS (IMPORTANT FOR MONTHLY)
const monthPrefix = date.slice(0, 7);

const monthlyGoalsData = await GoalDetail.findOne({
  userId: req.user.id,
  date: `${monthPrefix}-01`,
  goalType: "monthly"
});

const { startDate, endDate } = getWeekRange(date);

const weeklyGoalsData = await GoalDetail.findOne({
  userId: req.user.id,
  date: startDate,
  goalType: "weekly"
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

    const totalAppointmentVisiting = await PresentationDetail.countDocuments({
  userId: req.user.id,
  isVisitedAppointment: true,
  visitedDate: String(date).trim()
});


    const totalForms = forms.length;

    const totalRevenue = await getRevenueByPaymentDate({
      userId: req.user.id,
      exactDate: String(date).trim()
    });


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

    const weeklyVisitedAppointments = await PresentationDetail.find({
  userId: req.user.id,
  isVisitedAppointment: true
});

const weeklyAppointmentVisiting = weeklyVisitedAppointments.filter(
  (item) =>
    item.visitedDate &&
    item.visitedDate >= startDate &&
    item.visitedDate <= endDate
).length;

    const weeklyFormsCount = weeklyForms.length;

    const weeklyRevenue = await getRevenueByPaymentDate({
      userId: req.user.id,
      startDate,
      endDate
    });

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

    const monthlyAppointmentVisiting = await PresentationDetail.countDocuments({
  userId: req.user.id,
  isVisitedAppointment: true,
  visitedDate: { $regex: `^${monthStart}` }
});

    const monthlyFormsCount = monthlyForms.length;

    const monthlyRevenue = await getRevenueByPaymentDate({
      userId: req.user.id,
      monthPrefix: monthStart
    });

    res.status(200).json({
  dailyGoals: {
  calls:
    type === "daily"
      ? savedGoals?.dailyCallsGoal || 0
      : dailyGoalsData?.dailyCallsGoal || 0,

  presentations:
    type === "daily"
      ? savedGoals?.dailyPresentationsGoal || 0
      : dailyGoalsData?.dailyPresentationsGoal || 0,

  appointmentFixing:
    type === "daily"
      ? savedGoals?.appointmentFixingGoal || 0
      : dailyGoalsData?.appointmentFixingGoal || 0,

  appointmentVisiting:
    type === "daily"
      ? savedGoals?.appointmentVisitingGoal || 0
      : dailyGoalsData?.appointmentVisitingGoal || 0,

  forms:
    type === "daily"
      ? savedGoals?.formsGoal || 0
      : dailyGoalsData?.formsGoal || 0,

  revenue:
    type === "daily"
      ? savedGoals?.revenueGoal || 0
      : dailyGoalsData?.revenueGoal || 0
},

 weeklyGoals: {
  calls:
    type === "weekly"
      ? savedGoals?.weeklyCallsGoal || 0
      : weeklyGoalsData?.weeklyCallsGoal || 0,

  presentations:
    type === "weekly"
      ? savedGoals?.weeklyPresentationsGoal || 0
      : weeklyGoalsData?.weeklyPresentationsGoal || 0,

  appointmentFixing:
    type === "weekly"
      ? savedGoals?.weeklyAppointmentFixingGoal || 0
      : weeklyGoalsData?.weeklyAppointmentFixingGoal || 0,

  appointmentVisiting:
    type === "weekly"
      ? savedGoals?.weeklyAppointmentVisitingGoal || 0
      : weeklyGoalsData?.weeklyAppointmentVisitingGoal || 0,

  forms:
    type === "weekly"
      ? savedGoals?.weeklyFormsGoal || 0
      : weeklyGoalsData?.weeklyFormsGoal || 0,

  revenue:
    type === "weekly"
      ? savedGoals?.weeklyRevenueGoal || 0
      : weeklyGoalsData?.weeklyRevenueGoal || 0
},

monthlyGoals: {
  calls:
    type === "monthly"
      ? savedGoals?.monthlyCallsGoal || 0
      : monthlyGoalsData?.monthlyCallsGoal || 0,

  presentations:
    type === "monthly"
      ? savedGoals?.monthlyPresentationsGoal || 0
      : monthlyGoalsData?.monthlyPresentationsGoal || 0,

  appointmentFixing:
    type === "monthly"
      ? savedGoals?.monthlyAppointmentFixingGoal || 0
      : monthlyGoalsData?.monthlyAppointmentFixingGoal || 0,

  appointmentVisiting:
    type === "monthly"
      ? savedGoals?.monthlyAppointmentVisitingGoal || 0
      : monthlyGoalsData?.monthlyAppointmentVisitingGoal || 0,

  forms:
    type === "monthly"
      ? savedGoals?.monthlyFormsGoal || 0
      : monthlyGoalsData?.monthlyFormsGoal || 0,

  revenue:
    type === "monthly"
      ? savedGoals?.monthlyRevenueGoal || 0
      : monthlyGoalsData?.monthlyRevenueGoal || 0
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

lastUpdatedAt: savedGoals?.lastUpdatedAt || null,
lastUpdatedBy: savedGoals?.lastUpdatedBy || null,

weekInfo: {
  startDate,
  endDate
},
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
      type,

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

    let saveDate = date;

if (type === "weekly") {
  const { startDate } = getWeekRange(date);
  saveDate = startDate;
}

if (type === "monthly") {
  saveDate = `${date.slice(0, 7)}-01`;
}

const updateData = {};

if (type === "daily") {
  updateData.dailyCallsGoal = Number(dailyCallsGoal || 0);
  updateData.dailyPresentationsGoal = Number(dailyPresentationsGoal || 0);
  updateData.appointmentFixingGoal = Number(appointmentFixingGoal || 0);
  updateData.appointmentVisitingGoal = Number(appointmentVisitingGoal || 0);
  updateData.formsGoal = Number(formsGoal || 0);
  updateData.revenueGoal = Number(revenueGoal || 0);
}

if (type === "weekly") {
  updateData.weeklyCallsGoal = Number(weeklyCallsGoal || 0);
  updateData.weeklyPresentationsGoal = Number(weeklyPresentationsGoal || 0);
  updateData.weeklyAppointmentFixingGoal = Number(weeklyAppointmentFixingGoal || 0);
  updateData.weeklyAppointmentVisitingGoal = Number(weeklyAppointmentVisitingGoal || 0);
  updateData.weeklyFormsGoal = Number(weeklyFormsGoal || 0);
  updateData.weeklyRevenueGoal = Number(weeklyRevenueGoal || 0);
}

if (type === "monthly") {
  updateData.monthlyCallsGoal = Number(monthlyCallsGoal || 0);
  updateData.monthlyPresentationsGoal = Number(monthlyPresentationsGoal || 0);
  updateData.monthlyAppointmentFixingGoal = Number(monthlyAppointmentFixingGoal || 0);
  updateData.monthlyAppointmentVisitingGoal = Number(monthlyAppointmentVisitingGoal || 0);
  updateData.monthlyFormsGoal = Number(monthlyFormsGoal || 0);
  updateData.monthlyRevenueGoal = Number(monthlyRevenueGoal || 0);
}

const updatedGoal = await GoalDetail.findOneAndUpdate(
  {
    userId: req.user.id,
    date: saveDate,
    goalType: type
  },
  {
    $set: {
      ...updateData,
      goalType: type,
      lastUpdatedAt: new Date(),
      lastUpdatedBy: req.user.id
    }
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