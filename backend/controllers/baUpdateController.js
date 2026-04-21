import FormDetail from "../models/FormDetail.js";
import PhotoshootUpdate from "../models/PhotoshootUpdate.js";
import ContactNumberUpdate from "../models/ContactNumberUpdate.js";
import GmbProfileUpdate from "../models/GmbProfileUpdate.js";
import PageHandlingUpdate from "../models/PageHandlingUpdate.js";
import SuspendedPageUpdate from "../models/SuspendedPageUpdate.js";
import GoogleOtherServiceUpdate from "../models/GoogleOtherServiceUpdate.js";

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
      otherUpdates
    ] = await Promise.all([
      PhotoshootUpdate.find({ formId: { $in: formIds } }),
      ContactNumberUpdate.find({ formId: { $in: formIds } }),
      GmbProfileUpdate.find({ formId: { $in: formIds } }),
      PageHandlingUpdate.find({ formId: { $in: formIds } }),
      SuspendedPageUpdate.find({ formId: { $in: formIds } }),
      GoogleOtherServiceUpdate.find({ formId: { $in: formIds } })
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

          contactNumber: contactMap.get(id)?.comment || "",
          gmbProfile: gmbMap.get(id)?.comment || "",
          pageHandling: pageMap.get(id)?.comment || "",
          suspendedPage: suspendedMap.get(id)?.comment || "",
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