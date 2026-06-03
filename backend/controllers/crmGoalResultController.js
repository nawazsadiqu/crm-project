import CrmGoalResult from "../models/CrmGoalResult.js";

const emptyValues = {
  posters: 0,
  reviewReplies: 0,
  contactEscalation: 0,
  otherEscalation: 0,
  clientsQuery: 0,
  schedulingPhotoshoot: 0,
  uploadingPhotoshoot: 0,
  contactReEscalation: 0,
  otherReEscalation: 0,
  monthlyReports: 0,
  clientDataRenewal: 0
};

const normalizeValues = (values = {}) => {
  const normalized = {};

  Object.keys(emptyValues).forEach((key) => {
    normalized[key] = Number(values[key] || 0);
  });

  return normalized;
};

const getWeekRange = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);

  const format = (d) => d.toISOString().split("T")[0];

  return {
    startDate: format(start)
  };
};

const getSaveDate = (date, type) => {
  if (type === "weekly") {
    return getWeekRange(date).startDate;
  }

  if (type === "monthly") {
    return `${date.slice(0, 7)}-01`;
  }

  return date;
};

export const getCrmGoalsAndResults = async (req, res) => {
  try {
    const { date, type } = req.query;

    if (!date || !type) {
      return res.status(400).json({
        message: "Date and type are required"
      });
    }

    const dailyDate = date;
    const weeklyDate = getWeekRange(date).startDate;
    const monthlyDate = `${date.slice(0, 7)}-01`;

    const dailyData = await CrmGoalResult.findOne({
      userId: req.user.id,
      date: dailyDate,
      goalType: "daily"
    });

    const weeklyData = await CrmGoalResult.findOne({
      userId: req.user.id,
      date: weeklyDate,
      goalType: "weekly"
    });

    const monthlyData = await CrmGoalResult.findOne({
      userId: req.user.id,
      date: monthlyDate,
      goalType: "monthly"
    });

    const selectedDate = getSaveDate(date, type);

    const selectedData = await CrmGoalResult.findOne({
      userId: req.user.id,
      date: selectedDate,
      goalType: type
    });

    res.status(200).json({
      dailyGoals: {
        ...emptyValues,
        ...(dailyData?.goals || {})
      },
      weeklyGoals: {
        ...emptyValues,
        ...(weeklyData?.goals || {})
      },
      monthlyGoals: {
        ...emptyValues,
        ...(monthlyData?.goals || {})
      },

      dailyResults: {
        ...emptyValues,
        ...(dailyData?.results || {})
      },
      weeklyResults: {
        ...emptyValues,
        ...(weeklyData?.results || {})
      },
      monthlyResults: {
        ...emptyValues,
        ...(monthlyData?.results || {})
      },

      lastUpdatedAt: selectedData?.lastUpdatedAt || null,
      lastUpdatedBy: selectedData?.lastUpdatedBy || null
    });
  } catch (error) {
    console.error("getCrmGoalsAndResults error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveCrmGoalsAndResults = async (req, res) => {
  try {
    const {
      date,
      type,
      dailyGoals,
      weeklyGoals,
      monthlyGoals,
      dailyResults,
      weeklyResults,
      monthlyResults
    } = req.body;

    if (!date || !type) {
      return res.status(400).json({
        message: "Date and type are required"
      });
    }

    const saveDate = getSaveDate(date, type);

    let goals = {};
    let results = {};

    if (type === "daily") {
      goals = normalizeValues(dailyGoals);
      results = normalizeValues(dailyResults);
    }

    if (type === "weekly") {
      goals = normalizeValues(weeklyGoals);
      results = normalizeValues(weeklyResults);
    }

    if (type === "monthly") {
      goals = normalizeValues(monthlyGoals);
      results = normalizeValues(monthlyResults);
    }

    const savedRecord = await CrmGoalResult.findOneAndUpdate(
      {
        userId: req.user.id,
        date: saveDate,
        goalType: type
      },
      {
        userId: req.user.id,
        date: saveDate,
        goalType: type,
        goals,
        results,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: req.user.id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      message: "CRM goals and results saved successfully",
      data: savedRecord
    });
  } catch (error) {
    console.error("saveCrmGoalsAndResults error:", error);
    res.status(500).json({ message: error.message });
  }
};