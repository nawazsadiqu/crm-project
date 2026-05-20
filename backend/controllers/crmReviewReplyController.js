import FormDetail from "../models/FormDetail.js";
import ReviewReplyUpdate from "../models/ReviewReplyUpdate.js";

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
  if (value === "replied") return "Replied";
  return "Pending";
};

export const getReviewReplyBusinesses = async (req, res) => {
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

    const weeklyReplies = await ReviewReplyUpdate.find({
      formId: { $in: formIds },
      weekKey
    });

    const weeklyReplyMap = new Map();

    weeklyReplies.forEach((item) => {
      weeklyReplyMap.set(String(item.formId), {
        weeklyReplyStatus: normalizeStatus(item.weeklyReplyStatus)
      });
    });

    const mergedData = formRecords.map((item) => {
      const weeklyData = weeklyReplyMap.get(String(item._id)) || {};

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

        // same comment from Optimization page
        optimizationComment: item.optimizationComment || "",
        natureOfBusiness: item.natureOfBusiness || "",

        weeklyReplyStatus: normalizeStatus(weeklyData.weeklyReplyStatus)
      };
    });

    return res.status(200).json({
      weekKey,
      weekStartDate,
      weekEndDate,
      records: mergedData
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveReviewReplyWeeklyStatus = async (req, res) => {
  try {
    const { formId, weeklyReplyStatus, date } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    const normalizedNewStatus = normalizeStatus(weeklyReplyStatus);

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const { weekKey, weekStartDate, weekEndDate } = getWeekDetails(
      date ? new Date(date) : new Date()
    );

    const existingRecord = await ReviewReplyUpdate.findOne({
      formId,
      weekKey
    });

    const normalizedOldStatus = normalizeStatus(
      existingRecord?.weeklyReplyStatus
    );

    let statusMarkedRepliedAt = existingRecord?.statusMarkedRepliedAt || null;

    if (normalizedOldStatus !== "Replied" && normalizedNewStatus === "Replied") {
      statusMarkedRepliedAt = new Date();
    }

    if (normalizedOldStatus === "Replied" && normalizedNewStatus === "Pending") {
      statusMarkedRepliedAt = null;
    }

    const updatedRecord = await ReviewReplyUpdate.findOneAndUpdate(
      {
        formId,
        weekKey
      },
      {
        updatedBy: req.user.id,
        formId,
        weekKey,
        weekStartDate,
        weekEndDate,
        weeklyReplyStatus: normalizedNewStatus,
        statusMarkedRepliedAt
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      message: "Review reply status saved successfully",
      data: updatedRecord
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReviewReplyWeeklyCount = async (req, res) => {
  try {
    const { date } = req.query;

    const { weekKey, weekStartDate, weekEndDate } = getWeekDetails(
      date ? new Date(date) : new Date()
    );

    const count = await ReviewReplyUpdate.countDocuments({
      weekKey,
      weeklyReplyStatus: "Replied"
    });

    return res.status(200).json({
      weekKey,
      weekStartDate,
      weekEndDate,
      weeklyReplyCount: count
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};