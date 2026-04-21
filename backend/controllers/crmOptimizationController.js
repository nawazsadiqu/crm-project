import FormDetail from "../models/FormDetail.js";
import OptimizationUpdate from "../models/OptimizationUpdate.js";

const getWeekDetails = (inputDate = new Date()) => {
  const date = new Date(inputDate);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const toDateString = (d) => d.toISOString().split("T")[0];

  return {
    weekKey: toDateString(weekStart),
    weekStartDate: toDateString(weekStart),
    weekEndDate: toDateString(weekEnd)
  };
};

const normalizeStatus = (status = "") => {
  const value = String(status || "").trim().toLowerCase();

  if (value === "updated") return "Updated";
  return "Pending";
};

export const getOptimizationBusinesses = async (req, res) => {
  try {
    const { date } = req.query;

    const { weekKey, weekStartDate, weekEndDate } = getWeekDetails(
      date ? new Date(date) : new Date()
    );

    const formRecords = await FormDetail.find({
      serviceCategory: "googleServices",
      googleServices: "Optimization"
    }).sort({ createdAt: -1 });

    const formIds = formRecords.map((item) => item._id);

    const weeklyUpdates = await OptimizationUpdate.find({
      userId: req.user.id,
      formId: { $in: formIds },
      weekKey
    });

    const weeklyUpdateMap = new Map();

    weeklyUpdates.forEach((item) => {
      weeklyUpdateMap.set(String(item.formId), {
        weeklyUpdateStatus: normalizeStatus(item.weeklyUpdateStatus),
        natureOfBusiness: item.natureOfBusiness || ""
      });
    });

    const mergedData = formRecords.map((item) => {
      const weeklyData = weeklyUpdateMap.get(String(item._id)) || {};

      return {
        _id: item._id,
        businessName: item.businessName || "",
        date: item.date || "",
        baName: item.baName || "",
        fullName: item.fullName || "",
        mobileNumber: item.mobileNumber || "",
        googleMapLink: item.googleMapLink || "",
        city: item.city || "",
        area: item.area || "",
        amount: Number(item.revenue || 0),
        natureOfBusiness: weeklyData.natureOfBusiness || "",
        weeklyUpdateStatus: normalizeStatus(weeklyData.weeklyUpdateStatus)
      };
    });

    return res.status(200).json({
      weekKey,
      weekStartDate,
      weekEndDate,
      records: mergedData
    });
  } catch (error) {
    console.error("getOptimizationBusinesses error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const saveOptimizationWeeklyStatus = async (req, res) => {
  try {
    const { formId, weeklyUpdateStatus, natureOfBusiness, date } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    const normalizedNewStatus = normalizeStatus(weeklyUpdateStatus);

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const { weekKey, weekStartDate, weekEndDate } = getWeekDetails(
      date ? new Date(date) : new Date()
    );

    const existingRecord = await OptimizationUpdate.findOne({
      userId: req.user.id,
      formId,
      weekKey
    });

    const normalizedOldStatus = normalizeStatus(
      existingRecord?.weeklyUpdateStatus
    );

    let statusMarkedUpdatedAt = existingRecord?.statusMarkedUpdatedAt || null;

    // count only when moving into Updated from anything non-Updated
    if (normalizedOldStatus !== "Updated" && normalizedNewStatus === "Updated") {
      statusMarkedUpdatedAt = new Date();
    }

    // remove the mark when moved back to Pending
    if (normalizedOldStatus === "Updated" && normalizedNewStatus === "Pending") {
      statusMarkedUpdatedAt = null;
    }

    const updatedRecord = await OptimizationUpdate.findOneAndUpdate(
      {
        userId: req.user.id,
        formId,
        weekKey
      },
      {
        userId: req.user.id,
        formId,
        weekKey,
        weekStartDate,
        weekEndDate,
        weeklyUpdateStatus: normalizedNewStatus,
        natureOfBusiness:
          natureOfBusiness !== undefined
            ? natureOfBusiness
            : existingRecord?.natureOfBusiness || "",
        statusMarkedUpdatedAt
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      message: "Optimization record saved successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("saveOptimizationWeeklyStatus error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTodayOptimizationUpdateCount = async (req, res) => {
  try {
    const { date } = req.query;

    const { weekKey, weekStartDate, weekEndDate } = getWeekDetails(
      date ? new Date(date) : new Date()
    );

    const count = await OptimizationUpdate.countDocuments({
      userId: req.user.id,
      weekKey,
      weeklyUpdateStatus: "Updated"
    });

    return res.status(200).json({
      weekKey,
      weekStartDate,
      weekEndDate,
      weeklyUpdateCount: count
    });
  } catch (error) {
    console.error("getTodayOptimizationUpdateCount error:", error);
    return res.status(500).json({ message: error.message });
  }
};