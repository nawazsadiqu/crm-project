import FormDetail from "../models/FormDetail.js";
import ContactNumberUpdate from "../models/ContactNumberUpdate.js";
import { decryptCredential } from "../utils/credentialEncryption.js";

const canViewAccessCredentials = (req) => {
  const role = String(
    req.user?.role || ""
  ).toLowerCase();

  return ["crm", "admin"].includes(role);
};

const safelyDecryptPassword = (
  encryptedPassword
) => {
  if (!encryptedPassword) {
    return "";
  }

  try {
    return decryptCredential(
      encryptedPassword
    );
  } catch (error) {
    console.error(
      "Failed to decrypt access password:",
      error.message
    );

    return "";
  }
}; 

export const getContactNumberBusinesses = async (req, res) => {
  try {
    if (!canViewAccessCredentials(req)) {
      return res.status(403).json({
        message:
          "You are not authorized to view access credentials"
      });
    }

    const formRecords = await FormDetail.find({
  serviceCategory: "googleServices",
  googleServices: "Contact Number"
})
  .select("+accessPasswordEncrypted")
  .sort({ createdAt: -1 });

    const formIds = formRecords.map((item) => item._id);

    const savedUpdates = await ContactNumberUpdate.find({
      formId: { $in: formIds }
    }).sort({ updatedAt: -1 });

    const updateMap = new Map();

    savedUpdates.forEach((item) => {
      const key = String(item.formId);

      if (!updateMap.has(key)) {
        updateMap.set(key, {
          comment: item.comment || "",
          escalationStatus: item.escalationStatus || "not escalated",
          escalationId: item.escalationId || ""
        });
      }
    });

    const mergedData = formRecords.map((item) => {
      const saved = updateMap.get(String(item._id)) || {};

      return {
  _id: item._id,
  date: item.date || "",
  baName: item.baName || "",
  businessName: item.businessName || "",
  contactNumber: item.mobileNumber || "",
  googleMapLink: item.googleMapLink || "",

  // Customer email
  email: item.email || "",

  // Google access credentials
  accessEmail:
    item.accessEmail || "",

  accessPassword:
    safelyDecryptPassword(
      item.accessPasswordEncrypted
    ),

  comment:
    saved.comment || "",

  escalationStatus:
    saved.escalationStatus ||
    "not escalated",

  escalationId:
    saved.escalationId || ""
};
    });

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("getContactNumberBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveContactNumberComment = async (req, res) => {
  try {
    const { formId, comment, escalationStatus, escalationId } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    if (
      escalationStatus !== undefined &&
      !["not escalated", "escalated", "live"].includes(escalationStatus)
    ) {
      return res.status(400).json({
        message: "Invalid escalation status"
      });
    }

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const updateData = {
      formId,
      updatedBy: req.user.id
    };

    if (comment !== undefined) {
      updateData.comment = comment || "";
    }

    if (escalationStatus !== undefined) {
      updateData.escalationStatus = escalationStatus || "not escalated";
    }

    if (escalationId !== undefined) {
      updateData.escalationId = escalationId || "";
    }

    const updatedRecord = await ContactNumberUpdate.findOneAndUpdate(
      { formId },
      updateData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      message: "Contact number details saved successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("saveContactNumberComment error:", error);
    res.status(500).json({ message: error.message });
  }
};