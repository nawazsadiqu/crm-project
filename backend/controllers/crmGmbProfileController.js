import FormDetail from "../models/FormDetail.js";
import GmbProfileUpdate from "../models/GmbProfileUpdate.js";
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

export const getGmbProfileBusinesses = async (req, res) => {
  try {
    if (!canViewAccessCredentials(req)) {
      return res.status(403).json({
        message:
          "You are not authorized to view access credentials"
      });
    }

    const formRecords = await FormDetail.find({
      serviceCategory: "googleServices",
      googleServices: "GMB Profile"
    })
      .select("+accessPasswordEncrypted")
      .sort({ createdAt: -1 });

    const formIds = formRecords.map((item) => item._id);

    const savedComments = await GmbProfileUpdate.find({
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

      // Customer contact email
      email: item.email || "",

      // Google Business access credentials
      accessEmail: item.accessEmail || "",

      accessPassword:
        safelyDecryptPassword(
          item.accessPasswordEncrypted
        ),

      comment:
        commentMap.get(
          String(item._id)
        ) || ""
    }));

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("getGmbProfileBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveGmbProfileComment = async (req, res) => {
  try {
    const { formId, comment } = req.body;

    if (!formId) {
      return res.status(400).json({ message: "Form ID is required" });
    }

    const formRecord = await FormDetail.findById(formId);

    if (!formRecord) {
      return res.status(404).json({ message: "Business record not found" });
    }

    const updatedRecord = await GmbProfileUpdate.findOneAndUpdate(
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
    console.error("saveGmbProfileComment error:", error);
    res.status(500).json({ message: error.message });
  }
};