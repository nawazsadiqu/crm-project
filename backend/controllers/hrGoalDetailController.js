import HrGoalDetail from "../models/HrGoalDetail.js";
import HrCallLog from "../models/HrCallLog.js";
import HrCandidatePipeline from "../models/HrCandidatePipeline.js";

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
    endDate: format(end),
  };
};

const countHrCalls = async (userId, startDate, endDate) => {
  const logs = await HrCallLog.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  return logs.reduce((sum, log) => {
    return (
      sum +
      (Array.isArray(log.calls)
        ? log.calls.filter((call) => call.status).length
        : 0)
    );
  }, 0);
};

export const getHrGoalsAndResults = async (req, res) => {
  try {
    const { date, type = "daily" } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let saveDate = date;
    let startDate = date;
    let endDate = date;

    if (type === "weekly") {
      const weekRange = getWeekRange(date);
      saveDate = weekRange.startDate;
      startDate = weekRange.startDate;
      endDate = weekRange.endDate;
    }

    if (type === "monthly") {
      const monthPrefix = date.slice(0, 7);
      saveDate = `${monthPrefix}-01`;
      startDate = `${monthPrefix}-01`;
      endDate = `${monthPrefix}-31`;
    }

    const savedGoals = await HrGoalDetail.findOne({
      userId: req.user.id,
      date: saveDate,
      goalType: type,
    });

    const callsResult = await countHrCalls(req.user.id, startDate, endDate);

    const resumesResult = await HrCandidatePipeline.countDocuments({
      resumeGot: "Yes",
      updatedAt: {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    });

    const schedulingInterviewResult =
      await HrCandidatePipeline.countDocuments({
        interview: true,
        interviewDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });

    let goals = {
      calls: 0,
      resumes: 0,
      schedulingInterview: 0,
      dataSourcing: 0,
    };

    let results = {
      calls: callsResult,
      resumes: resumesResult,
      schedulingInterview: schedulingInterviewResult,
      dataSourcing: 0,
    };

    if (type === "daily") {
      goals = {
        calls: savedGoals?.dailyCallsGoal || 0,
        resumes: savedGoals?.dailyResumesGoal || 0,
        schedulingInterview: savedGoals?.dailySchedulingInterviewGoal || 0,
        dataSourcing: savedGoals?.dailyDataSourcingGoal || 0,
      };

      results.dataSourcing = savedGoals?.dailyDataSourcingResult || 0;
    }

    if (type === "weekly") {
      goals = {
        calls: savedGoals?.weeklyCallsGoal || 0,
        resumes: savedGoals?.weeklyResumesGoal || 0,
        schedulingInterview:
          savedGoals?.weeklySchedulingInterviewGoal || 0,
        dataSourcing: savedGoals?.weeklyDataSourcingGoal || 0,
      };

      results.dataSourcing = savedGoals?.weeklyDataSourcingResult || 0;
    }

    if (type === "monthly") {
      goals = {
        calls: savedGoals?.monthlyCallsGoal || 0,
        resumes: savedGoals?.monthlyResumesGoal || 0,
        schedulingInterview:
          savedGoals?.monthlySchedulingInterviewGoal || 0,
        dataSourcing: savedGoals?.monthlyDataSourcingGoal || 0,
      };

      results.dataSourcing = savedGoals?.monthlyDataSourcingResult || 0;
    }

    res.status(200).json({
      goals,
      results,
      lastUpdatedAt: savedGoals?.lastUpdatedAt || null,
      lastUpdatedBy: savedGoals?.lastUpdatedBy || null,
      range: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("getHrGoalsAndResults error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveHrGoals = async (req, res) => {
  try {
    const {
      date,
      type = "daily",
      callsGoal,
      resumesGoal,
      schedulingInterviewGoal,
      dataSourcingGoal,
      dataSourcingResult,
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
      updateData.dailyCallsGoal = Number(callsGoal || 0);
      updateData.dailyResumesGoal = Number(resumesGoal || 0);
      updateData.dailySchedulingInterviewGoal = Number(
        schedulingInterviewGoal || 0
      );
      updateData.dailyDataSourcingGoal = Number(dataSourcingGoal || 0);
      updateData.dailyDataSourcingResult = Number(dataSourcingResult || 0);
    }

    if (type === "weekly") {
      updateData.weeklyCallsGoal = Number(callsGoal || 0);
      updateData.weeklyResumesGoal = Number(resumesGoal || 0);
      updateData.weeklySchedulingInterviewGoal = Number(
        schedulingInterviewGoal || 0
      );
      updateData.weeklyDataSourcingGoal = Number(dataSourcingGoal || 0);
      updateData.weeklyDataSourcingResult = Number(dataSourcingResult || 0);
    }

    if (type === "monthly") {
      updateData.monthlyCallsGoal = Number(callsGoal || 0);
      updateData.monthlyResumesGoal = Number(resumesGoal || 0);
      updateData.monthlySchedulingInterviewGoal = Number(
        schedulingInterviewGoal || 0
      );
      updateData.monthlyDataSourcingGoal = Number(dataSourcingGoal || 0);
      updateData.monthlyDataSourcingResult = Number(dataSourcingResult || 0);
    }

    const updatedGoal = await HrGoalDetail.findOneAndUpdate(
      {
        userId: req.user.id,
        date: saveDate,
        goalType: type,
      },
      {
        $set: {
          ...updateData,
          goalType: type,
          lastUpdatedAt: new Date(),
          lastUpdatedBy: req.user.id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      message: "HR goals saved successfully",
      data: updatedGoal,
    });
  } catch (error) {
    console.error("saveHrGoals error:", error);
    res.status(500).json({ message: error.message });
  }
};