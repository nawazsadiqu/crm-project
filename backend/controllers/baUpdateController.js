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

/*
  Convert service names to a consistent format
  for checking selected services.
*/
const normalizeServiceName = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

/*
  Get all services selected in the business form.
*/
const getFormServices = (form) => {
  const services = [
    ...(Array.isArray(form.googleServices)
      ? form.googleServices
      : []),

    ...(Array.isArray(form.otherServices)
      ? form.otherServices
      : []),

    form.googleServicesOther || "",
    form.otherServicesOther || ""
  ]
    .map((service) => String(service || "").trim())
    .filter(Boolean);

  /*
    Remove duplicate service names.
  */
  return Array.from(new Set(services));
};

/*
  Check whether the business form contains
  a particular service.
*/
const formHasService = (form, keywords) => {
  const selectedServices = getFormServices(form).map(
    normalizeServiceName
  );

  return selectedServices.some((service) =>
    keywords.some((keyword) =>
      service.includes(
        normalizeServiceName(keyword)
      )
    )
  );
};

/*
  Create a map using formId.

  Optimization can contain multiple weekly records.
  The latest updated record will remain in the map.
*/
const mapByFormId = (records) => {
  const map = new Map();

  const sortedRecords = [...records].sort((a, b) => {
    return (
      new Date(a.updatedAt || 0) -
      new Date(b.updatedAt || 0)
    );
  });

  sortedRecords.forEach((item) => {
    map.set(String(item.formId), item);
  });

  return map;
};

export const getBaUpdates = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await EmployeeDetail.findOne({
      userId
    });

    const readDoc = await BaUpdateRead.findOne({
      userId
    });

    const lastReadAt = readDoc?.lastReadAt
      ? new Date(readDoc.lastReadAt)
      : new Date(
          Date.now() - 24 * 60 * 60 * 1000
        );

    const lastRecentUpdatesViewedAt =
      readDoc?.lastRecentUpdatesViewedAt
        ? new Date(readDoc.lastRecentUpdatesViewedAt)
        : new Date(0);

    /*
      Only real CRM updates are treated as unread.

      Default Pending statuses are not treated as
      new/unread updates.
    */
    const isUnread = (update) => {
      if (!update?.updatedAt) {
        return false;
      }

      return (
        new Date(update.updatedAt) >
        new Date(lastReadAt)
      );
    };

    /*
      Get every business form submitted by this BA.

      This makes a business appear on the Updates page
      immediately after the form is submitted.
    */
    const forms = await FormDetail.find({
      userId
    }).sort({
      createdAt: -1
    });

    const formIds = forms.map((form) => form._id);

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
      PhotoshootUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      ContactNumberUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      GmbProfileUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      PageHandlingUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      SuspendedPageUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      GoogleOtherServiceUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      OptimizationUpdate.find({
        formId: {
          $in: formIds
        }
      }),

      GmbQuery.find({
        baName: employee?.name || "",
        status: "not done"
      }).sort({
        createdAt: -1
      })
    ]);

    const photoshootMap =
      mapByFormId(photoshoots);

    const contactMap =
      mapByFormId(contactUpdates);

    const gmbMap =
      mapByFormId(gmbUpdates);

    const pageMap =
      mapByFormId(pageUpdates);

    const suspendedMap =
      mapByFormId(suspendedUpdates);

    const otherMap =
      mapByFormId(otherUpdates);

    const optimizationMap =
      mapByFormId(optimizationUpdates);

    const recentUpdates = [];

    /*
      Add only actual CRM updates to Recent Updates.

      Default Pending statuses will not appear as
      recent updates.
    */
    const pushRecentUpdate = (
      form,
      serviceName,
      updateDoc,
      comment = ""
    ) => {
      if (!updateDoc?.updatedAt) {
        return;
      }

      recentUpdates.push({
        _id: `${form._id}-${serviceName}`,
        formId: form._id,
        businessName: form.businessName || "-",
        date: form.date || "",
        location: `${form.city || ""} ${
          form.area || ""
        }`.trim(),
        serviceName,
        comment,
        updatedAt: updateDoc.updatedAt
      });
    };

    const result = forms.map((form) => {
      const formId = String(form._id);

      const photoshootUpdate =
        photoshootMap.get(formId);

      const contactUpdate =
        contactMap.get(formId);

      const gmbUpdate =
        gmbMap.get(formId);

      const pageUpdate =
        pageMap.get(formId);

      const suspendedUpdate =
        suspendedMap.get(formId);

      const otherUpdate =
        otherMap.get(formId);

      const optimizationUpdate =
        optimizationMap.get(formId);

      /*
        Detect the services selected in the form.
      */
      const hasPhotoshootService =
        formHasService(form, [
          "photoshoot",
          "photo shoot",
          "photo shooting",
          "photos"
        ]);

      const hasOptimizationService =
        formHasService(form, [
          "optimization",
          "optimisation",
          "gmb optimization",
          "gmb optimisation",
          "seo optimization",
          "seo"
        ]);

      const hasContactNumberService =
        formHasService(form, [
          "contact number",
          "contact number update",
          "number update",
          "phone number update"
        ]);

      const hasGmbProfileService =
        formHasService(form, [
          "gmb profile",
          "google business profile",
          "business profile",
          "gmb creation",
          "gmb profile creation"
        ]);

      const hasPageHandlingService =
        formHasService(form, [
          "page handling",
          "gmb page handling"
        ]);

      const hasSuspendedPageService =
        formHasService(form, [
          "suspended page",
          "page suspension",
          "suspension",
          "suspended profile"
        ]);

      const hasOtherService =
        formHasService(form, [
          "other service",
          "other services",
          "google other service",
          "google other services"
        ]) ||
        Boolean(
          String(
            form.googleServicesOther || ""
          ).trim()
        ) ||
        Boolean(
          String(
            form.otherServicesOther || ""
          ).trim()
        );

      /*
        A business receives the New Update indicator
        only when a genuine update document changed.
      */
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
          ? `Shoot: ${
              photoshootUpdate.status ||
              "Pending"
            }, Upload: ${
              photoshootUpdate.uploadStatus ||
              "pending"
            }`
          : ""
      );

      pushRecentUpdate(
        form,
        "Optimization",
        optimizationUpdate,
        optimizationUpdate
          ? `Status: ${
              optimizationUpdate.weeklyUpdateStatus ||
              "Pending"
            }${
              form.optimizationComment
                ? `, Comment: ${form.optimizationComment}`
                : ""
            }`
          : form.optimizationComment || ""
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
        businessName:
          form.businessName || "-",

        date: form.date || "",

        location: `${form.city || ""} ${
          form.area || ""
        }`.trim(),

        /*
          Return every selected service.
        */
        services: getFormServices(form),

        isNewUpdate:
          businessHasNewUpdate,

        updates: {
          /*
            If Photoshoot is selected but CRM has not
            updated it, return Pending instead of null.
          */
          photoshoot:
            hasPhotoshootService ||
            Boolean(photoshootUpdate)
              ? {
                  status:
                    photoshootUpdate?.status ||
                    "Pending",

                  uploadStatus:
                    photoshootUpdate?.uploadStatus ||
                    "pending",

                  isNewUpdate:
                    Boolean(photoshootUpdate) &&
                    isUnread(
                      photoshootUpdate
                    )
                }
              : null,

          /*
            Contact Number will initially show Pending.
          */
          contactNumber:
            hasContactNumberService ||
            Boolean(contactUpdate)
              ? {
                  comment:
                    contactUpdate?.comment ||
                    "Pending",

                  escalationStatus:
                    contactUpdate?.escalationStatus ||
                    "not escalated",

                  isNewUpdate:
                    Boolean(contactUpdate) &&
                    isUnread(contactUpdate)
                }
              : null,

          /*
            Optimization will initially show Pending,
            even when optimizationComment is empty.
          */
          optimization:
            hasOptimizationService ||
            Boolean(optimizationUpdate) ||
            Boolean(
              String(
                form.optimizationComment || ""
              ).trim()
            )
              ? {
                  comment:
                    form.optimizationComment ||
                    "Pending",

                  weeklyUpdateStatus:
                    optimizationUpdate
                      ?.weeklyUpdateStatus ||
                    "Pending",

                  isNewUpdate:
                    Boolean(
                      optimizationUpdate
                    ) &&
                    isUnread(
                      optimizationUpdate
                    )
                }
              : null,

          /*
            GMB Profile will initially show Pending.
          */
          gmbProfile:
            hasGmbProfileService ||
            Boolean(gmbUpdate)
              ? {
                  comment:
                    gmbUpdate?.comment ||
                    "Pending",

                  isNewUpdate:
                    Boolean(gmbUpdate) &&
                    isUnread(gmbUpdate)
                }
              : null,

          /*
            Page Handling will initially show Pending.
          */
          pageHandling:
            hasPageHandlingService ||
            Boolean(pageUpdate)
              ? {
                  comment:
                    pageUpdate?.comment ||
                    "Pending",

                  isNewUpdate:
                    Boolean(pageUpdate) &&
                    isUnread(pageUpdate)
                }
              : null,

          /*
            Suspended Page will initially show Pending.
          */
          suspendedPage:
            hasSuspendedPageService ||
            Boolean(suspendedUpdate)
              ? {
                  comment:
                    suspendedUpdate?.comment ||
                    "Pending",

                  escalationStatus:
                    suspendedUpdate
                      ?.escalationStatus ||
                    "not escalated",

                  isNewUpdate:
                    Boolean(
                      suspendedUpdate
                    ) &&
                    isUnread(
                      suspendedUpdate
                    )
                }
              : null,

          /*
            Other Services will initially show Pending.
          */
          otherServices:
            hasOtherService ||
            Boolean(otherUpdate)
              ? {
                  comment:
                    otherUpdate?.comment ||
                    "Pending",

                  isNewUpdate:
                    Boolean(otherUpdate) &&
                    isUnread(otherUpdate)
                }
              : null
        }
      };
    });

    recentUpdates.sort((a, b) => {
  return (
    new Date(b.updatedAt) -
    new Date(a.updatedAt)
  );
});

const recentUnreadCount = recentUpdates.filter(
  (update) => {
    if (!update?.updatedAt) {
      return false;
    }

    return (
      new Date(update.updatedAt) >
      lastRecentUpdatesViewedAt
    );
  }
).length;

    res.status(200).json({
      businesses: result,
      gmbQueries,
      recentUpdates,
      recentUnreadCount
    });
  } catch (error) {
    console.error(
      "getBaUpdates error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch BA updates"
    });
  }
};

export const getBaUpdatesUnreadCount = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const forms = await FormDetail.find({
      userId
    }).select("_id");

    const formIds = forms.map(
      (form) => form._id
    );

    const readDoc =
      await BaUpdateRead.findOne({
        userId
      });

    const lastReadAt =
      readDoc?.lastReadAt ||
      new Date(0);

    /*
      Count only actual update documents.

      Default Pending statuses do not increase
      the unread count.
    */
    const counts = await Promise.all([
      PhotoshootUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      }),

      ContactNumberUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      }),

      GmbProfileUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      }),

      PageHandlingUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      }),

      SuspendedPageUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      }),

      GoogleOtherServiceUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      }),

      OptimizationUpdate.countDocuments({
        formId: {
          $in: formIds
        },
        updatedAt: {
          $gt: lastReadAt
        }
      })
    ]);

    const unreadCount = counts.reduce(
      (sum, count) =>
        sum + Number(count || 0),
      0
    );

    res.status(200).json({
      unreadCount
    });
  } catch (error) {
    console.error(
      "getBaUpdatesUnreadCount error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch unread count"
    });
  }
};

export const markBaUpdatesAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    await BaUpdateRead.findOneAndUpdate(
      {
        userId
      },
      {
        lastReadAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    res.status(200).json({
      message: "Updates marked as read"
    });
  } catch (error) {
    console.error(
      "markBaUpdatesAsRead error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to mark updates as read"
    });
  }
};

export const markRecentUpdatesAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    await BaUpdateRead.findOneAndUpdate(
      {
        userId
      },
      {
        lastRecentUpdatesViewedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    res.status(200).json({
      message: "Recent updates marked as viewed"
    });
  } catch (error) {
    console.error(
      "markRecentUpdatesAsRead error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to mark recent updates as viewed"
    });
  }
};