import FormDetail from "../models/FormDetail.js";
import PhotoshootUpdate from "../models/PhotoshootUpdate.js";
import ContactNumberUpdate from "../models/ContactNumberUpdate.js";
import GmbProfileUpdate from "../models/GmbProfileUpdate.js";
import PageHandlingUpdate from "../models/PageHandlingUpdate.js";
import SuspendedPageUpdate from "../models/SuspendedPageUpdate.js";
import GoogleOtherServiceUpdate from "../models/GoogleOtherServiceUpdate.js";
import OptimizationUpdate from "../models/OptimizationUpdate.js";
import BaUpdateRead from "../models/BaUpdateRead.js";

export const getBaUpdates = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get BA forms
    const forms = await FormDetail.find({ userId }).sort({ createdAt: -1 });

    const formIds = forms.map((f) => f._id);

    // 2. Fetch all updates
    const [
      photoshoots,
      contactUpdates,
      gmbUpdates,
      pageUpdates,
      suspendedUpdates,
      otherUpdates,
      optimizationUpdates
    ] = await Promise.all([
      PhotoshootUpdate.find({ formId: { $in: formIds } }),
      ContactNumberUpdate.find({ formId: { $in: formIds } }),
      GmbProfileUpdate.find({ formId: { $in: formIds } }),
      PageHandlingUpdate.find({ formId: { $in: formIds } }),
      SuspendedPageUpdate.find({ formId: { $in: formIds } }),
      GoogleOtherServiceUpdate.find({ formId: { $in: formIds } }),
      OptimizationUpdate.find({ formId: { $in: formIds } })
    ]);

    // helper map
    const mapByFormId = (arr) => {
      const map = new Map();
      arr.forEach((item) => {
        map.set(String(item.formId), item);
      });
      return map;
    };

    const photoshootMap = mapByFormId(photoshoots);
    const contactMap = mapByFormId(contactUpdates);
    const gmbMap = mapByFormId(gmbUpdates);
    const pageMap = mapByFormId(pageUpdates);
    const suspendedMap = mapByFormId(suspendedUpdates);
    const otherMap = mapByFormId(otherUpdates);
    const optimizationMap = mapByFormId(optimizationUpdates);

    // 3. Merge data
    const result = forms.map((form) => {
      const id = String(form._id);

      return {
        _id: form._id,
        businessName: form.businessName,
        location: `${form.city || ""} ${form.area || ""}`,
        services: [
          ...(form.googleServices || []),
          ...(form.otherServices || [])
        ],

        updates: {
          photoshoot: photoshootMap.get(id)
            ? {
                status: photoshootMap.get(id).status || "Pending",
                uploadStatus:
                  photoshootMap.get(id).uploadStatus || "pending"
              }
            : null,

          contactNumber: contactMap.get(id)
            ? {
              comment: contactMap.get(id).comment || "",
              escalationStatus:
              contactMap.get(id).escalationStatus || "not escalated"
            }
          : null,
          optimization: form.optimizationComment
            ? {
              comment: form.optimizationComment || "",
              weeklyUpdateStatus:
              optimizationMap.get(id)?.weeklyUpdateStatus || "Pending"
            }
          : null,
          gmbProfile: gmbMap.get(id)?.comment || "",
          pageHandling: pageMap.get(id)?.comment || "",
          suspendedPage: suspendedMap.get(id)
          ? {
          comment: suspendedMap.get(id).comment || "",
          escalationStatus:
          suspendedMap.get(id).escalationStatus || "not escalated"
          }
          : null,
          otherServices: otherMap.get(id)?.comment || ""
        }
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("getBaUpdates error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getBaUpdatesUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const forms = await FormDetail.find({ userId }).select("_id");
    const formIds = forms.map((f) => f._id);

    const readDoc = await BaUpdateRead.findOne({ userId });
    const lastReadAt = readDoc?.lastReadAt || new Date(0);

    const counts = await Promise.all([
      PhotoshootUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      }),
      ContactNumberUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      }),
      GmbProfileUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      }),
      PageHandlingUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      }),
      SuspendedPageUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      }),
      GoogleOtherServiceUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      }),
      OptimizationUpdate.countDocuments({
        formId: { $in: formIds },
        updatedAt: { $gt: lastReadAt }
      })
    ]);

    const unreadCount = counts.reduce((sum, count) => sum + count, 0);

    res.status(200).json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markBaUpdatesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await BaUpdateRead.findOneAndUpdate(
      { userId },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Updates marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};