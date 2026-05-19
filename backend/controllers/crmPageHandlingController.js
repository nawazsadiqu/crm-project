import FormDetail from "../models/FormDetail.js";
import PageHandlingUpdate from "../models/PageHandlingUpdate.js";

export const getPageHandlingBusinesses = async (req, res) => {
  try {
    const formRecords = await FormDetail.find({
      serviceCategory: "googleServices",
      googleServices: "Page Handling"
    }).sort({ createdAt: -1 });

    const formIds = formRecords.map((item) => item._id);

    const savedComments = await PageHandlingUpdate.find({
      formId: { $in: formIds }
    }).sort({ updatedAt: -1 });

    const commentMap = new Map();

    savedComments.forEach((item) => {
      const key = String(item.formId);

      if (!commentMap.has(key)) {
        commentMap.set(key, item.comment || "");
      }
    });

    const mergedData = formRecords.map((item) => ({
      _id: item._id,
      date: item.date || "",
      baName: item.baName || "",
      businessName: item.businessName || "",
      contactNumber: item.mobileNumber || "",
      googleMapLink: item.googleMapLink || "",
      email: item.email || "",
      comment: commentMap.get(String(item._id)) || ""
    }));

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("getPageHandlingBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const savePageHandlingComment = async (req, res) => {
  try {
    const { formId, comment } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const updatedRecord = await PageHandlingUpdate.findOneAndUpdate(
      {
        formId
      },
      {
        formId,
        comment: comment || "",
        updatedBy: req.user.id
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      message: "Comment saved successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("savePageHandlingComment error:", error);
    res.status(500).json({ message: error.message });
  }
};