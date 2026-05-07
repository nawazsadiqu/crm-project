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

    console.log("GOALS API HIT", req.query);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let savedGoals = null;

if (date.length === 10) {
  // DAILY
  savedGoals = await GoalDetail.findOne({
    userId: req.user.id,
    date,
    goalType: "daily"
  });
} else {
  // fallback
  savedGoals = await GoalDetail.findOne({
    userId: req.user.id,
    date,
    goalType: "daily"
  });
}

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

    const totalRevenue = forms.reduce(
      (sum, item) => sum + Number(item.exGst  || 0),
      0
    );


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

    const monthlyAppointmentVisiting = await PresentationDetail.countDocuments({
  userId: req.user.id,
  isVisitedAppointment: true,
  visitedDate: { $regex: `^${monthStart}` }
});

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
  calls: weeklyGoalsData?.weeklyCallsGoal || 0,
  presentations: weeklyGoalsData?.weeklyPresentationsGoal || 0,
  appointmentFixing:
    weeklyGoalsData?.weeklyAppointmentFixingGoal || 0,
  appointmentVisiting:
    weeklyGoalsData?.weeklyAppointmentVisitingGoal || 0,
  forms: weeklyGoalsData?.weeklyFormsGoal || 0,
  revenue: weeklyGoalsData?.weeklyRevenueGoal || 0
},

  monthlyGoals: {
  calls: monthlyGoalsData?.monthlyCallsGoal || 0,
  presentations: monthlyGoalsData?.monthlyPresentationsGoal || 0,
  appointmentFixing: monthlyGoalsData?.monthlyAppointmentFixingGoal || 0,
  appointmentVisiting: monthlyGoalsData?.monthlyAppointmentVisitingGoal || 0,
  forms: monthlyGoalsData?.monthlyFormsGoal || 0,
  revenue: monthlyGoalsData?.monthlyRevenueGoal || 0
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
      goalType: type
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