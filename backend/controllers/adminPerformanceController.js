import EmployeeDetail from "../models/EmployeeDetail.js";
import TmcLog from "../models/TmcLog.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import Attendance from "../models/Attendance.js";
import GoalDetail from "../models/GoalDetail.js";

// CRM
import ContactNumberUpdate from "../models/ContactNumberUpdate.js";
import GmbProfileUpdate from "../models/GmbProfileUpdate.js";
import OptimizationUpdate from "../models/OptimizationUpdate.js";
import PageHandlingUpdate from "../models/PageHandlingUpdate.js";
import PhotoshootUpdate from "../models/PhotoshootUpdate.js";
import SuspendedPageUpdate from "../models/SuspendedPageUpdate.js";

// Developer
import WebsiteProjectPlanner from "../models/WebsiteProjectPlanner.js";

// Marketing
import DigitalMarketingPlanner from "../models/DigitalMarketingPlanner.js";

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
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
    const temp = new Date(d);
    const day = temp.getDay(); // Sunday = 0

    startDate = new Date(temp);
    startDate.setDate(temp.getDate() - day);
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

          const presentations = tmcLogs.reduce(
            (sum, item) => sum + (item.presentations?.length || 0),
            0
          );

          const presentationDetails = await PresentationDetail.find(
            presentationFilter
          );

          const appointmentFixing = presentationDetails.filter(
            (item) => item.isAppointment === true
          ).length;

          const appointmentVisiting = presentationDetails.filter(
            (item) => item.isVisitedAppointment === true
          ).length;

          const formsData = await FormDetail.find(formFilter);

          const forms = formsData.length;

          const revenue = formsData.reduce(
            (sum, item) => sum + Number(item.revenue || 0),
            0
          );

          let goalDoc = null;

          if (type === "daily") {
            goalDoc = await GoalDetail.findOne({
              userId: employee.userId,
              date: selectedDateString
            });
          } else if (type === "weekly") {
            goalDoc = await GoalDetail.findOne({
              userId: employee.userId,
              date: { $gte: weekStartString, $lte: weekEndString }
            }).sort({ date: -1 });
          } else if (type === "monthly") {
            goalDoc = await GoalDetail.findOne({
              userId: employee.userId,
              date: { $regex: `^${monthString}` }
            }).sort({ date: -1 });
          } else if (type === "yearly") {
            const yearString = `${selectedDate.getFullYear()}`;
            goalDoc = await GoalDetail.findOne({
              userId: employee.userId,
              date: { $regex: `^${yearString}` }
            }).sort({ date: -1 });
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
              calls: 100,
              presentations: 20,
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

          const results = {
            calls,
            presentations,
            appointmentFixing,
            appointmentVisiting,
            forms,
            revenue
          };

          metrics = {
            goals,
            results
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
            userId: employee.userId,
            createdAt: { $gte: startDate, $lte: endDate }
          };

          const contactUpdates =
            await ContactNumberUpdate.countDocuments(filter);
          const gmbUpdates = await GmbProfileUpdate.countDocuments(filter);
          const optimizations =
            await OptimizationUpdate.countDocuments(filter);
          const pageHandling =
            await PageHandlingUpdate.countDocuments(filter);
          const photoshoots = await PhotoshootUpdate.countDocuments({
            ...filter,
            status: "Done"
          });
          const suspendedFixes =
            await SuspendedPageUpdate.countDocuments(filter);

          metrics = {
            contactUpdates,
            gmbUpdates,
            optimizations,
            pageHandling,
            photoshoots,
            suspendedFixes
          };

          score =
            contactUpdates * 2 +
            gmbUpdates * 3 +
            optimizations * 5 +
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
    const { startDate, endDate } = getDateRange(type, date);

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
        const presentationDetails = await PresentationDetail.find({
          userId,
          date: { $gte: fromString, $lte: toString }
        });

        return presentationDetails.filter(
          (item) => item.isVisitedAppointment === true
        ).length;
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
          (sum, item) => sum + Number(item.revenue || 0),
          0
        );
      }

      return 0;
    };

    const formatEntityGoal = async (entityName, fromDate, toDate, mode) => {
      const fromString = formatDate(fromDate);
      const toString = formatDate(toDate);

      const goalDocs = await GoalDetail.find({
        userId,
        date: { $gte: fromString, $lte: toString }
      }).sort({ date: 1 });

      if (mode === "weekly") {
        if (entityName === "calls") {
          return goalDocs.length > 0 ? goalDocs.length * 100 : 6 * 100;
        }

        if (entityName === "presentations") {
          return goalDocs.length > 0 ? goalDocs.length * 20 : 6 * 20;
        }

        if (entityName === "appointmentFixing") {
          return goalDocs.reduce(
            (sum, doc) => sum + Number(doc.appointmentFixingGoal || 0),
            0
          );
        }

        if (entityName === "appointmentVisiting") {
          return goalDocs.reduce(
            (sum, doc) => sum + Number(doc.appointmentVisitingGoal || 0),
            0
          );
        }

        if (entityName === "forms") {
          return goalDocs.reduce(
            (sum, doc) => sum + Number(doc.formsGoal || 0),
            0
          );
        }

        if (entityName === "revenue") {
          return goalDocs.reduce(
            (sum, doc) => sum + Number(doc.revenueGoal || 0),
            0
          );
        }
      }

      if (mode === "monthly") {
        const latestGoalDoc = goalDocs[goalDocs.length - 1];

        if (!latestGoalDoc) return 0;

        if (entityName === "calls") {
          return Number(latestGoalDoc.monthlyCallsGoal || 0);
        }

        if (entityName === "presentations") {
          return Number(latestGoalDoc.monthlyPresentationsGoal || 0);
        }

        if (entityName === "appointmentFixing") {
          return Number(latestGoalDoc.monthlyAppointmentFixingGoal || 0);
        }

        if (entityName === "appointmentVisiting") {
          return Number(latestGoalDoc.monthlyAppointmentVisitingGoal || 0);
        }

        if (entityName === "forms") {
          return Number(latestGoalDoc.monthlyFormsGoal || 0);
        }

        if (entityName === "revenue") {
          return Number(latestGoalDoc.monthlyRevenueGoal || 0);
        }
      }

      return 0;
    };

    let chartData = [];

    if (type === "weekly") {
      for (let i = 0; i < 6; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(startDate.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const result = await formatEntityResult(entity, dayStart, dayEnd);
        const goal = await formatEntityGoal(entity, dayStart, dayEnd, "weekly");

        chartData.push({
          label: `Day ${i + 1}`,
          goal,
          result
        });
      }
    }

    if (type === "monthly") {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

      const weeklyBuckets = [
        { label: "Week 1", start: 1, end: 7 },
        { label: "Week 2", start: 8, end: 14 },
        { label: "Week 3", start: 15, end: 21 },
        { label: "Week 4", start: 22, end: lastDateOfMonth }
      ];

      for (const bucket of weeklyBuckets) {
        const bucketStart = new Date(year, month, bucket.start);
        bucketStart.setHours(0, 0, 0, 0);

        const bucketEnd = new Date(year, month, bucket.end);
        bucketEnd.setHours(23, 59, 59, 999);

        const result = await formatEntityResult(entity, bucketStart, bucketEnd);
        const goal = await formatEntityGoal(entity, bucketStart, bucketEnd, "monthly");

        chartData.push({
          label: bucket.label,
          goal,
          result
        });
      }
    }

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Admin performance chart error:", error);
    res.status(500).json({ message: error.message });
  }
};