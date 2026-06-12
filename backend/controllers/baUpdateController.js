import FormDetail from "../models/FormDetail.js";
import PhotoshootUpdate from "../models/PhotoshootUpdate.js";
import ContactNumberUpdate from "../models/ContactNumberUpdate.js";
import GmbProfileUpdate from "../models/GmbProfileUpdate.js";
import PageHandlingUpdate from "../models/PageHandlingUpdate.js";
import SuspendedPageUpdate from "../models/SuspendedPageUpdate.js";
import GoogleOtherServiceUpdate from "../models/GoogleOtherServiceUpdate.js";
import OptimizationUpdate from "../models/OptimizationUpdate.js";
import BaUpdateRead from "../models/BaUpdateRead.js";
import GmbQuery from "../models/GmbQuery.js";
import EmployeeDetail from "../models/EmployeeDetail.js";

export const getBaUpdates = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await EmployeeDetail.findOne({ userId });

    const readDoc = await BaUpdateRead.findOne({ userId });
    const lastReadAt = readDoc?.lastReadAt || new Date(0);

    const isUnread = (update) => {
      if (!update?.updatedAt) return false;
      return new Date(update.updatedAt) > new Date(lastReadAt);
    };

    const forms = await FormDetail.find({ userId }).sort({ createdAt: -1 });
    const formIds = forms.map((f) => f._id);

    const [
      photoshoots,
      contactUpdates,
      gmbUpdates,
      pageUpdates,
      suspendedUpdates,
      otherUpdates,
      optimizationUpdates,
      gmbQueries
    ] = await Promise.all([
      PhotoshootUpdate.find({ formId: { $in: formIds } }),
      ContactNumberUpdate.find({ formId: { $in: formIds } }),
      GmbProfileUpdate.find({ formId: { $in: formIds } }),
      PageHandlingUpdate.find({ formId: { $in: formIds } }),
      SuspendedPageUpdate.find({ formId: { $in: formIds } }),
      GoogleOtherServiceUpdate.find({ formId: { $in: formIds } }),
      OptimizationUpdate.find({ formId: { $in: formIds } }),
      GmbQuery.find({
        baName: employee?.name || "",
        status: "not done"
      }).sort({ createdAt: -1 })
    ]);

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

    const recentUpdates = [];

    const pushRecentUpdate = (form, serviceName, updateDoc, comment = "") => {
      if (!updateDoc?.updatedAt) return;

      recentUpdates.push({
        _id: `${form._id}-${serviceName}`,
        formId: form._id,
        businessName: form.businessName || "-",
        date: form.date || "",
        location: `${form.city || ""} ${form.area || ""}`,
        serviceName,
        comment,
        updatedAt: updateDoc.updatedAt
      });
    };

    const result = forms.map((form) => {
      const id = String(form._id);

      const photoshootUpdate = photoshootMap.get(id);
      const contactUpdate = contactMap.get(id);
      const gmbUpdate = gmbMap.get(id);
      const pageUpdate = pageMap.get(id);
      const suspendedUpdate = suspendedMap.get(id);
      const otherUpdate = otherMap.get(id);
      const optimizationUpdate = optimizationMap.get(id);

      const businessHasNewUpdate =
        isUnread(photoshootUpdate) ||
        isUnread(contactUpdate) ||
        isUnread(gmbUpdate) ||
        isUnread(pageUpdate) ||
        isUnread(suspendedUpdate) ||
        isUnread(otherUpdate) ||
        isUnread(optimizationUpdate);

      pushRecentUpdate(
        form,
        "Photoshoot",
        photoshootUpdate,
        photoshootUpdate
          ? `Shoot: ${photoshootUpdate.status || "Pending"}, Upload: ${
              photoshootUpdate.uploadStatus || "pending"
            }`
          : ""
      );

      pushRecentUpdate(
        form,
        "Optimization",
        optimizationUpdate,
        form.optimizationComment || ""
      );

      pushRecentUpdate(
        form,
        "Contact Number",
        contactUpdate,
        contactUpdate?.comment || ""
      );

      pushRecentUpdate(
        form,
        "GMB Profile",
        gmbUpdate,
        gmbUpdate?.comment || ""
      );

      pushRecentUpdate(
        form,
        "Page Handling",
        pageUpdate,
        pageUpdate?.comment || ""
      );

      pushRecentUpdate(
        form,
        "Suspended Page",
        suspendedUpdate,
        suspendedUpdate?.comment || ""
      );

      pushRecentUpdate(
        form,
        "Other Services",
        otherUpdate,
        otherUpdate?.comment || ""
      );

      return {
        _id: form._id,
        businessName: form.businessName,
        date: form.date || "",
        location: `${form.city || ""} ${form.area || ""}`,
        services: [
          ...(form.googleServices || []),
          ...(form.otherServices || [])
        ],
        isNewUpdate: businessHasNewUpdate,

        updates: {
          photoshoot: photoshootUpdate
            ? {
                status: photoshootUpdate.status || "Pending",
                uploadStatus: photoshootUpdate.uploadStatus || "pending",
                isNewUpdate: isUnread(photoshootUpdate)
              }
            : null,

          contactNumber: contactUpdate
            ? {
                comment: contactUpdate.comment || "",
                escalationStatus:
                  contactUpdate.escalationStatus || "not escalated",
                isNewUpdate: isUnread(contactUpdate)
              }
            : null,

          optimization: form.optimizationComment
            ? {
                comment: form.optimizationComment || "",
                weeklyUpdateStatus:
                  optimizationUpdate?.weeklyUpdateStatus || "Pending",
                isNewUpdate: isUnread(optimizationUpdate)
              }
            : null,

          gmbProfile: gmbUpdate
            ? {
                comment: gmbUpdate.comment || "",
                isNewUpdate: isUnread(gmbUpdate)
              }
            : null,

          pageHandling: pageUpdate
            ? {
                comment: pageUpdate.comment || "",
                isNewUpdate: isUnread(pageUpdate)
              }
            : null,

          suspendedPage: suspendedUpdate
            ? {
                comment: suspendedUpdate.comment || "",
                escalationStatus:
                  suspendedUpdate.escalationStatus || "not escalated",
                isNewUpdate: isUnread(suspendedUpdate)
              }
            : null,

          otherServices: otherUpdate
            ? {
                comment: otherUpdate.comment || "",
                isNewUpdate: isUnread(otherUpdate)
              }
            : null
        }
      };
    });

    recentUpdates.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.status(200).json({
      businesses: result,
      gmbQueries,
      recentUpdates
    });
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