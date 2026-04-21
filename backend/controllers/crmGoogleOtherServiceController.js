import FormDetail from "../models/FormDetail.js";
import GoogleOtherServiceUpdate from "../models/GoogleOtherServiceUpdate.js";

export const getGoogleOtherServiceBusinesses = async (req, res) => {
  try {
    const formRecords = await FormDetail.find({
      serviceCategory: "googleServices",
      googleServices: "Others"
    }).sort({ createdAt: -1 });

    const formIds = formRecords.map((item) => item._id);

    const savedComments = await GoogleOtherServiceUpdate.find({
      userId: req.user.id,
      formId: { $in: formIds }
    });

    const commentMap = new Map();
    savedComments.forEach((item) => {
      commentMap.set(String(item.formId), item.comment || "");
    });

    const mergedData = formRecords.map((item) => ({
      _id: item._id,
      date: item.date || "",
      baName: item.baName || "",
      businessName: item.businessName || "",
      contactNumber: item.mobileNumber || "",
      googleMapLink: item.googleMapLink || "",
      email: item.email || "",
      googleOtherService: item.googleServicesOther || "",
      comment: commentMap.get(String(item._id)) || ""
    }));

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("getGoogleOtherServiceBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveGoogleOtherServiceComment = async (req, res) => {
  try {
    const { formId, comment } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const updatedRecord = await GoogleOtherServiceUpdate.findOneAndUpdate(
      {
        userId: req.user.id,
        formId
      },
      {
        comment: comment || ""
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
    console.error("saveGoogleOtherServiceComment error:", error);
    res.status(500).json({ message: error.message });
  }
};