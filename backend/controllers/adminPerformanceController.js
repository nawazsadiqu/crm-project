import EmployeeDetail from "../models/EmployeeDetail.js";
import TmcLog from "../models/TmcLog.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import Attendance from "../models/Attendance.js";
import GoalDetail from "../models/GoalDetail.js";

// CRM
import CrmGoalResult from "../models/CrmGoalResult.js";
import ContactNumberUpdate from "../models/ContactNumberUpdate.js";
import GmbProfileUpdate from "../models/GmbProfileUpdate.js";
import OptimizationUpdate from "../models/OptimizationUpdate.js";
import ReviewReplyUpdate from "../models/ReviewReplyUpdate.js";
import PageHandlingUpdate from "../models/PageHandlingUpdate.js";
import PhotoshootUpdate from "../models/PhotoshootUpdate.js";
import SuspendedPageUpdate from "../models/SuspendedPageUpdate.js";

// Developer
import WebsiteProjectPlanner from "../models/WebsiteProjectPlanner.js";

// Marketing
import DigitalMarketingPlanner from "../models/DigitalMarketingPlanner.js";

const formatDate = (date) => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRange = (type, date) => {
  const d = new Date(date);

  let startDate, endDate;

  if (type === "daily") {
    startDate = new Date(d);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "weekly") {
  const temp = new Date(`${date}T12:00:00`);

  const day = temp.getDay(); // Sunday = 0, Monday = 1
  const mondayOffset = day === 0 ? -6 : 1 - day;

  startDate = new Date(temp);
  startDate.setDate(temp.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
} else if (type === "monthly") {
    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "yearly") {
    startDate = new Date(d.getFullYear(), 0, 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d.getFullYear(), 11, 31);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

export const getAdminPerformance = async (req, res) => {
  try {
    const { type, date } = req.query;

    if (!type || !date) {
      return res.status(400).json({
        message: "Type and date are required"
      });
    }

    const { startDate, endDate } = getDateRange(type, date);

    const selectedDate = new Date(date);
    const selectedDateString = formatDate(selectedDate);
    const weekStartString = formatDate(startDate);
    const weekEndString = formatDate(endDate);
    const monthString = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const employees = await EmployeeDetail.find().sort({ name: 1 });

    const performanceData = await Promise.all(
      employees.map(async (employee) => {
        const role = employee.role;

        if (!employee.userId) {
          return {
            employeeId: employee.employeeId,
            name: employee.name,
            role,
            metrics: {},
            score: 0
          };
        }

        let metrics = {};
        let score = 0;

        // =========================
        // 🟢 BA (SALES)
        // =========================
        if (role === "ba") {
          let tmcFilter = { userId: employee.userId };
          let presentationFilter = { userId: employee.userId };
          let formFilter = { userId: employee.userId };

          if (type === "daily") {
            tmcFilter.date = selectedDateString;
            presentationFilter.date = selectedDateString;
            formFilter.date = selectedDateString;
          } else if (type === "weekly") {
            tmcFilter.date = { $gte: weekStartString, $lte: weekEndString };
            presentationFilter.date = {
              $gte: weekStartString,
              $lte: weekEndString
            };
            formFilter.date = { $gte: weekStartString, $lte: weekEndString };
          } else if (type === "monthly") {
            tmcFilter.date = { $regex: `^${monthString}` };
            presentationFilter.date = { $regex: `^${monthString}` };
            formFilter.date = { $regex: `^${monthString}` };
          } else if (type === "yearly") {
            const yearString = `${selectedDate.getFullYear()}`;
            tmcFilter.date = { $regex: `^${yearString}` };
            presentationFilter.date = { $regex: `^${yearString}` };
            formFilter.date = { $regex: `^${yearString}` };
          }

          const tmcLogs = await TmcLog.find(tmcFilter);

          const calls = tmcLogs.reduce(
            (sum, item) => sum + (item.calls?.length || 0),
            0
          );

        const callDetails = {
  AP: 0,
  CBA: 0,
  CBP: 0,
  CCB: 0,
  NI: 0,
  CC: 0,
  NC: 0,
  NA: 0,
  P: 0
};

tmcLogs.forEach((log) => {
  if (Array.isArray(log.calls)) {
    log.calls.forEach((call) => {
      if (call.status && callDetails.hasOwnProperty(call.status)) {
        callDetails[call.status] += 1;
      }
    });
  }
});

          const presentations = tmcLogs.reduce(
            (sum, item) => sum + (item.presentations?.length || 0),
            0
          );

          const presentationDetails = await PresentationDetail.find(
            presentationFilter
          );

          const addBaName = (items) =>
  items.map((item) => {
    const obj = item.toObject ? item.toObject() : item;

    return {
      ...obj,
      baName: employee.name
    };
  });

          const appointmentFixing = presentationDetails.filter(
            (item) => item.isAppointment === true
          ).length;

          let appointmentVisiting = 0;

if (type === "daily") {
  appointmentVisiting = await PresentationDetail.countDocuments({
    userId: employee.userId,
    isVisitedAppointment: true,
    visitedDate: selectedDateString
  });
} else if (type === "weekly") {
  appointmentVisiting = await PresentationDetail.countDocuments({
    userId: employee.userId,
    isVisitedAppointment: true,
    visitedDate: { $gte: weekStartString, $lte: weekEndString }
  });
} else if (type === "monthly") {
  appointmentVisiting = await PresentationDetail.countDocuments({
    userId: employee.userId,
    isVisitedAppointment: true,
    visitedDate: { $regex: `^${monthString}` }
  });
} else if (type === "yearly") {
  const yearString = `${selectedDate.getFullYear()}`;

  appointmentVisiting = await PresentationDetail.countDocuments({
    userId: employee.userId,
    isVisitedAppointment: true,
    visitedDate: { $regex: `^${yearString}` }
  });
}

          const formsData = await FormDetail.find(formFilter);

          const forms = formsData.length;

          const revenue = formsData.reduce(
            (sum, item) => sum + Number(item.exGst  || 0),
            0
          );

          const profitSharing = formsData.reduce(
            (sum, item) => sum + Number(item.profitSharing || 0),
            0
          );

          let goalDoc = null;

if (type === "daily") {
  goalDoc = await GoalDetail.findOne({
    userId: employee.userId,
    date: selectedDateString,
    goalType: "daily"
  });

  if (!goalDoc) {
    goalDoc = await GoalDetail.findOne({
      userId: employee.userId,
      date: selectedDateString,
      goalType: { $exists: false }
    });
  }
} else if (type === "weekly") {
  goalDoc = await GoalDetail.findOne({
    userId: employee.userId,
    date: weekStartString,
    goalType: "weekly"
  });

  if (!goalDoc) {
    goalDoc = await GoalDetail.findOne({
      userId: employee.userId,
      date: { $gte: weekStartString, $lte: weekEndString },
      goalType: { $exists: false }
    }).sort({ date: -1 });
  }
} else if (type === "monthly") {
  goalDoc = await GoalDetail.findOne({
    userId: employee.userId,
    date: `${monthString}-01`,
    goalType: "monthly"
  });

  if (!goalDoc) {
    goalDoc = await GoalDetail.findOne({
      userId: employee.userId,
      date: { $regex: `^${monthString}` },
      goalType: { $exists: false }
    }).sort({ date: -1 });
  }
} else if (type === "yearly") {
  goalDoc = null;
}

          let goals = {
            calls: 0,
            presentations: 0,
            appointmentFixing: 0,
            appointmentVisiting: 0,
            forms: 0,
            revenue: 0
          };

          if (type === "daily") {
  goals = {
    calls: Number(goalDoc?.dailyCallsGoal || 0),
    presentations: Number(goalDoc?.dailyPresentationsGoal || 0),
    appointmentFixing: Number(goalDoc?.appointmentFixingGoal || 0),
    appointmentVisiting: Number(goalDoc?.appointmentVisitingGoal || 0),
    forms: Number(goalDoc?.formsGoal || 0),
    revenue: Number(goalDoc?.revenueGoal || 0)
  };
          } else if (type === "weekly") {
            goals = {
              calls: Number(goalDoc?.weeklyCallsGoal || 0),
              presentations: Number(goalDoc?.weeklyPresentationsGoal || 0),
              appointmentFixing: Number(
                goalDoc?.weeklyAppointmentFixingGoal || 0
              ),
              appointmentVisiting: Number(
                goalDoc?.weeklyAppointmentVisitingGoal || 0
              ),
              forms: Number(goalDoc?.weeklyFormsGoal || 0),
              revenue: Number(goalDoc?.weeklyRevenueGoal || 0)
            };
          } else if (type === "monthly") {
            goals = {
              calls: Number(goalDoc?.monthlyCallsGoal || 0),
              presentations: Number(goalDoc?.monthlyPresentationsGoal || 0),
              appointmentFixing: Number(
                goalDoc?.monthlyAppointmentFixingGoal || 0
              ),
              appointmentVisiting: Number(
                goalDoc?.monthlyAppointmentVisitingGoal || 0
              ),
              forms: Number(goalDoc?.monthlyFormsGoal || 0),
              revenue: Number(goalDoc?.monthlyRevenueGoal || 0)
            };
          } else if (type === "yearly") {
            goals = {
              calls: 0,
              presentations: 0,
              appointmentFixing: 0,
              appointmentVisiting: 0,
              forms: 0,
              revenue: 0
            };
          }

          const appointmentVisitingDetailsData = await PresentationDetail.find({
  userId: employee.userId,
  isVisitedAppointment: true,
  ...(type === "daily"
    ? { visitedDate: selectedDateString }
    : type === "weekly"
    ? {
        visitedDate: {
          $gte: weekStartString,
          $lte: weekEndString
        }
      }
    : type === "monthly"
    ? {
        visitedDate: {
          $regex: `^${monthString}`
        }
      }
    : {})
});

const results = {
  calls,
  presentations,
  appointmentFixing,
  appointmentVisiting,
  forms,
  revenue,
  profitSharing,
  callDetails,

  presentationDetails: addBaName(presentationDetails),

  appointmentFixingDetails: addBaName(
    presentationDetails.filter((item) => item.isAppointment === true)
  ),

  appointmentVisitingDetails: addBaName(appointmentVisitingDetailsData),

  formsDetails: addBaName(formsData),

  revenueDetails: addBaName(
    formsData.filter((item) => Number(item.exGst || 0) > 0)
  )
};

          metrics = {
            goals,
            results,
            goalLastUpdatedAt: goalDoc?.lastUpdatedAt || null,
            goalLastUpdatedBy: goalDoc?.lastUpdatedBy || null
          };

          score =
            calls * 1 +
            presentations * 2 +
            appointmentFixing * 3 +
            appointmentVisiting * 3 +
            forms * 5 +
            revenue / 1000;
        }

        // =========================
        // 🔵 CRM
        // =========================
        else if (role === "crm") {
          const filter = {
            updatedBy: employee.userId,
            createdAt: { $gte: startDate, $lte: endDate }
          };

          const contactUpdates =
            await ContactNumberUpdate.countDocuments(filter);
          const gmbUpdates = await GmbProfileUpdate.countDocuments(filter);
          const optimizations =
            await OptimizationUpdate.countDocuments(filter);
          const reviewReplies =
            await ReviewReplyUpdate.countDocuments(filter);
          const pageHandling =
            await PageHandlingUpdate.countDocuments(filter);
          const photoshoots = await PhotoshootUpdate.countDocuments({
            ...filter,
            status: "Done"
          });
          const suspendedFixes =
            await SuspendedPageUpdate.countDocuments(filter);

          let crmGoalDate = selectedDateString;

if (type === "weekly") {
  crmGoalDate = weekStartString;
}

if (type === "monthly") {
  crmGoalDate = `${monthString}-01`;
}

const crmGoalDoc =
  type === "yearly"
    ? null
    : await CrmGoalResult.findOne({
        userId: employee.userId,
        date: crmGoalDate,
        goalType: type
      });

metrics = {
  contactUpdates,
  gmbUpdates,
  posters: optimizations,
  reviewReplies: Number(reviewReplies || 0),
  pageHandling,
  photoshoots,
  suspendedFixes,

  crmGoals: crmGoalDoc?.goals || {},
  crmResults: crmGoalDoc?.results || {},
  goalLastUpdatedAt: crmGoalDoc?.lastUpdatedAt || null,
  goalLastUpdatedBy: crmGoalDoc?.lastUpdatedBy || null
};

          score =
            contactUpdates * 2 +
            gmbUpdates * 3 +
            optimizations * 5 +
            reviewReplies * 3 +
            pageHandling * 2 +
            photoshoots * 4 +
            suspendedFixes * 3;
        }

        // =========================
        // 🟡 HR
        // =========================
        else if (role === "hr") {
          const attendance = await Attendance.find({
            employeeId: employee.employeeId,
            createdAt: { $gte: startDate, $lte: endDate }
          });

          const presentDays = attendance.filter(
            (a) => a.status === "Present"
          ).length;

          const absentDays = attendance.filter(
            (a) => a.status === "Absent"
          ).length;

          metrics = { presentDays, absentDays };

          score = presentDays * 5 - absentDays * 2;
        }

        // =========================
        // 🟣 WEBSITE DEVELOPER
        // =========================
        else if (role === "websiteDeveloper") {
          const projects = await WebsiteProjectPlanner.find({
            assignedTo: employee.userId,
            createdAt: { $gte: startDate, $lte: endDate }
          });

          const totalProjects = projects.length;

          const completedProjects = projects.filter(
            (p) => new Date(p.endDate) < new Date()
          ).length;

          const ongoingProjects = totalProjects - completedProjects;

          metrics = {
            totalProjects,
            completedProjects,
            ongoingProjects
          };

          score = completedProjects * 10 + ongoingProjects * 3;
        }

        // =========================
        // 🟠 DIGITAL MARKETING
        // =========================
        else if (role === "digitalMarketing") {
          const campaigns = await DigitalMarketingPlanner.find({
            assignedTo: employee.userId,
            createdAt: { $gte: startDate, $lte: endDate }
          });

          const totalCampaigns = campaigns.length;

          const postersDone = campaigns.reduce(
            (sum, c) => sum + (c.posterImagesDone || 0),
            0
          );

          const reelsDone = campaigns.reduce(
            (sum, c) => sum + (c.reelsDone || 0),
            0
          );

          const activeAds = campaigns.filter(
            (c) =>
              c.googleAdsCampaignStatus === "Active" ||
              c.metaAdsCampaignStatus === "Active"
          ).length;

          metrics = {
            totalCampaigns,
            postersDone,
            reelsDone,
            activeAds
          };

          score = postersDone * 2 + reelsDone * 3 + activeAds * 5;
        }

        return {
          employeeId: employee.employeeId,
          userId: employee.userId,
          name: employee.name,
          role,
          status: employee.status || "active",
          metrics,
          score: Math.round(score)
        };
      })
    );

    res.status(200).json(performanceData);
  } catch (error) {
    console.error("Admin performance error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAdminPerformanceChart = async (req, res) => {
  try {
    const { userId, type, date, entity } = req.query;

    if (!userId || !type || !date || !entity) {
      return res.status(400).json({
        message: "userId, type, date, and entity are required"
      });
    }

    if (!["weekly", "monthly"].includes(type)) {
      return res.status(400).json({
        message: "Chart is available only for weekly and monthly"
      });
    }

    const selectedDate = new Date(date);
    const { startDate } = getDateRange(type, date);

    const formatEntityResult = async (entityName, fromDate, toDate) => {
      const fromString = formatDate(fromDate);
      const toString = formatDate(toDate);

      if (entityName === "calls") {
        const tmcLogs = await TmcLog.find({
          userId,
          date: { $gte: fromString, $lte: toString }
        });

        return tmcLogs.reduce(
          (sum, item) => sum + (item.calls?.length || 0),
          0
        );
      }

      if (entityName === "presentations") {
        const tmcLogs = await TmcLog.find({
          userId,
          date: { $gte: fromString, $lte: toString }
        });

        return tmcLogs.reduce(
          (sum, item) => sum + (item.presentations?.length || 0),
          0
        );
      }

      if (entityName === "appointmentFixing") {
        const presentationDetails = await PresentationDetail.find({
          userId,
          date: { $gte: fromString, $lte: toString }
        });

        return presentationDetails.filter(
          (item) => item.isAppointment === true
        ).length;
      }

      if (entityName === "appointmentVisiting") {
        return await PresentationDetail.countDocuments({
          userId,
          isVisitedAppointment: true,
          visitedDate: { $gte: fromString, $lte: toString }
        });
      }

      if (entityName === "forms") {
        const formsData = await FormDetail.find({
          userId,
          date: { $gte: fromString, $lte: toString }
        });

        return formsData.length;
      }

      if (entityName === "revenue") {
        const formsData = await FormDetail.find({
          userId,
          date: { $gte: fromString, $lte: toString }
        });

        return formsData.reduce(
          (sum, item) => sum + Number(item.exGst || 0),
          0
        );
      }

      return 0;
    };

    const formatEntityGoal = async (entityName, fromDate, mode) => {
      const fromString = formatDate(fromDate);

      const getGoalValue = (doc, entity) => {
        if (!doc) return 0;

        if (entity === "calls") return Number(doc.weeklyCallsGoal || 0);
        if (entity === "presentations") return Number(doc.weeklyPresentationsGoal || 0);
        if (entity === "appointmentFixing") return Number(doc.weeklyAppointmentFixingGoal || 0);
        if (entity === "appointmentVisiting") return Number(doc.weeklyAppointmentVisitingGoal || 0);
        if (entity === "forms") return Number(doc.weeklyFormsGoal || 0);
        if (entity === "revenue") return Number(doc.weeklyRevenueGoal || 0);

        return 0;
      };

      const getDailyGoalValue = (doc, entity) => {
  if (!doc) return 0;

  if (entity === "calls") return Number(doc.dailyCallsGoal || 0);
  if (entity === "presentations") return Number(doc.dailyPresentationsGoal || 0);
  if (entity === "appointmentFixing") return Number(doc.appointmentFixingGoal || 0);
  if (entity === "appointmentVisiting") return Number(doc.appointmentVisitingGoal || 0);
  if (entity === "forms") return Number(doc.formsGoal || 0);
  if (entity === "revenue") return Number(doc.revenueGoal || 0);

  return 0;
};

      const defaultMonthlyStandards = {
          calls: 800,
          presentations: 150,
          appointmentFixing: 15,
          appointmentVisiting: 8,
          forms: 6,
          revenue: 25000
      };

      if (mode === "weekly") {
    const dailyGoalDoc = await GoalDetail.findOne({
      userId,
      date: fromString,
      goalType: "daily"
    });

    const dailyGoal = getDailyGoalValue(dailyGoalDoc, entityName);

    if (dailyGoalDoc) {
    return dailyGoal;
    }

    const weekStartString = formatDate(startDate);

    const weeklyGoalDoc = await GoalDetail.findOne({
      userId,
      date: weekStartString,
      goalType: "weekly"
    });

  const weeklyGoal = getGoalValue(weeklyGoalDoc, entityName);

  return weeklyGoal > 0 ? Math.ceil(weeklyGoal / 6) : 0;
}

      if (mode === "monthly") {
        const { startDate: realWeekStart } = getDateRange("weekly", fromString);
        const realWeekStartString = formatDate(realWeekStart);

        const weeklyGoalDoc = await GoalDetail.findOne({
          userId,
          date: realWeekStartString,
          goalType: "weekly"
        });

        return getGoalValue(weeklyGoalDoc, entityName);
      }

      return 0;
    };

    let chartData = [];

    if (type === "weekly") {
      chartData.push({
        label: "Day 0",
        goal: 0,
        result: 0
      });

      for (let i = 0; i < 6; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(startDate.getDate() + i);

        const result = await formatEntityResult(entity, dayStart, dayStart);
        const goal = await formatEntityGoal(entity, dayStart, "weekly");

        chartData.push({
          label: `Day ${i + 1}`,
          result,
          goal
        });
      }
    }

    if (type === "monthly") {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();

      const monthStart = new Date(year, month, 1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(year, month + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      chartData.push({
        label: "Week 0",
        goal: 0,
        result: 0
      });

      let currentDate = new Date(monthStart);
      let weekNumber = 1;

      while (currentDate <= monthEnd) {
        const { startDate: realWeekStart, endDate: realWeekEnd } =
          getDateRange("weekly", formatDate(currentDate));

        const resultStart = realWeekStart < monthStart ? monthStart : realWeekStart;
        const resultEnd = realWeekEnd > monthEnd ? monthEnd : realWeekEnd;

        const result = await formatEntityResult(entity, resultStart, resultEnd);
        const goalDateForChart =
  realWeekStart < monthStart ? monthStart : realWeekStart;

const goal = await formatEntityGoal(entity, goalDateForChart, "monthly");

        chartData.push({
          label: `Week ${weekNumber}`,
          goal,
          result
        });

        currentDate = new Date(realWeekEnd);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);

        weekNumber++;
      }
    }

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Admin performance chart error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAdminGoalDetails = async (req, res) => {
  try {
    const { type, date, entity, userId } = req.query;

    if (!type || !date || !entity) {
      return res.status(400).json({
        message: "type, date and entity are required"
      });
    }

    const selectedDate = new Date(date);
    const { startDate } = getDateRange(type, date);

    let goalDate = "";

    if (type === "daily") {
      goalDate = formatDate(selectedDate);
    }

    if (type === "weekly") {
      goalDate = formatDate(startDate);
    }

    if (type === "monthly") {
      goalDate = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-01`;
    }

    if (type === "yearly") {
      return res.status(200).json([]);
    }

    const baEmployees = await EmployeeDetail.find({
      role: "ba",
      userId: { $exists: true, $ne: null },
      ...(userId ? { userId } : {})
    });

    const baUserIds = baEmployees.map((emp) => emp.userId);

    const goals = await GoalDetail.find({
      userId: { $in: baUserIds },
      date: goalDate,
      goalType: type
    });

    const getGoalValue = (goal) => {
      if (type === "daily") {
        if (entity === "calls") return goal.dailyCallsGoal;
        if (entity === "presentations") return goal.dailyPresentationsGoal;
        if (entity === "appointmentFixing") return goal.appointmentFixingGoal;
        if (entity === "appointmentVisiting") return goal.appointmentVisitingGoal;
        if (entity === "forms") return goal.formsGoal;
        if (entity === "revenue") return goal.revenueGoal;
      }

      if (type === "weekly") {
        if (entity === "calls") return goal.weeklyCallsGoal;
        if (entity === "presentations") return goal.weeklyPresentationsGoal;
        if (entity === "appointmentFixing") return goal.weeklyAppointmentFixingGoal;
        if (entity === "appointmentVisiting") return goal.weeklyAppointmentVisitingGoal;
        if (entity === "forms") return goal.weeklyFormsGoal;
        if (entity === "revenue") return goal.weeklyRevenueGoal;
      }

      if (type === "monthly") {
        if (entity === "calls") return goal.monthlyCallsGoal;
        if (entity === "presentations") return goal.monthlyPresentationsGoal;
        if (entity === "appointmentFixing") return goal.monthlyAppointmentFixingGoal;
        if (entity === "appointmentVisiting") return goal.monthlyAppointmentVisitingGoal;
        if (entity === "forms") return goal.monthlyFormsGoal;
        if (entity === "revenue") return goal.monthlyRevenueGoal;
      }

      return 0;
    };

    const result = goals.map((goal) => {
      const employee = baEmployees.find(
        (emp) => emp.userId.toString() === goal.userId.toString()
      );

      return {
        _id: goal._id,
        baName: employee?.name || "-",
        employeeId: employee?.employeeId || "-",
        goalValue: Number(getGoalValue(goal) || 0),
        goalType: goal.goalType,
        date: goal.date,
        lastUpdatedAt: goal.lastUpdatedAt
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Admin goal details error:", error);
    res.status(500).json({ message: error.message });
  }
};