import FormDetail from "../models/FormDetail.js";
import PhotoshootUpdate from "../models/PhotoshootUpdate.js";
import sendEmail from "../utils/sendEmail.js";

export const getPhotoshootBusinesses = async (req, res) => {
  try {
    const formRecords = await FormDetail.find({
      serviceCategory: "googleServices",
      googleServices: "Photoshoot"
    }).sort({ createdAt: -1 });

    const formIds = formRecords.map((item) => item._id);

    const savedStatuses = await PhotoshootUpdate.find({
      userId: req.user.id,
      formId: { $in: formIds }
    });

    const statusMap = new Map();
    savedStatuses.forEach((item) => {
      statusMap.set(String(item.formId), {
        status: item.status || "Pending",
        uploadStatus: item.uploadStatus || "pending"
      });
    });

    const mergedData = formRecords.map((item) => {
      const saved = statusMap.get(String(item._id)) || {};

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
        status: saved.status || "Pending",
        uploadStatus: saved.uploadStatus || "pending"
      };
    });

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("getPhotoshootBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const savePhotoshootStatus = async (req, res) => {
  try {
    const { formId, status, uploadStatus } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    if (
      status !== undefined &&
      !["Done", "Pending", ""].includes(status)
    ) {
      return res.status(400).json({
        message: 'Status must be "Done", "Pending", or ""'
      });
    }

    if (
      uploadStatus !== undefined &&
      !["pending", "done"].includes(uploadStatus)
    ) {
      return res.status(400).json({
        message: 'Upload status must be "pending" or "done"'
      });
    }

    if (status === undefined && uploadStatus === undefined) {
      return res.status(400).json({
        message: "Status or upload status is required"
      });
    }

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const existingRecord = await PhotoshootUpdate.findOne({
      userId: req.user.id,
      formId
    });

    const previousUploadStatus = existingRecord?.uploadStatus || "pending";

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (uploadStatus !== undefined) updateData.uploadStatus = uploadStatus;

    const updatedRecord = await PhotoshootUpdate.findOneAndUpdate(
      {
        userId: req.user.id,
        formId
      },
      updateData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // Send mail only when upload status changes from pending to done
    if (
      uploadStatus === "done" &&
      previousUploadStatus !== "done" &&
      formRecord.email
    ) {
      try {
        const message = `Hi ${formRecord.fullName || "Sir/Madam"},

We are happy to inform you that the photos for your business "${formRecord.businessName}" have been successfully uploaded.

Your Google Business Profile upload process is now completed.

If you have any queries, feel free to contact us.

Thanks & Regards
Conquest Techno Solutions`;

        await sendEmail(
          formRecord.email,
          "Photos Upload Completed - Conquest Techno Solutions",
          message
        );
      } catch (emailError) {
        console.error("Upload completion email failed:", emailError.message);
      }
    }

    res.status(200).json({
      message: "Photoshoot status saved successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("savePhotoshootStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};