import FormDetail from "../models/FormDetail.js";
import DigitalMarketingPlanner from "../models/DigitalMarketingPlanner.js";

export const getDigitalMarketingBusinesses = async (req, res) => {
  try {
    const records = await FormDetail.find({
      $or: [
        { otherServices: { $in: ["Social Media Marketing"] } },
        { otherServices: { $in: ["Google Ads"] } },
        { otherServices: { $in: ["Meta Ads"] } },
        { otherServices: { $in: ["Other Services"] } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error("getDigitalMarketingBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDigitalMarketingBusinessOptions = async (req, res) => {
  try {
    const records = await FormDetail.find({
      $or: [
        { otherServices: { $in: ["Social Media Marketing"] } },
        { otherServices: { $in: ["Google Ads"] } },
        { otherServices: { $in: ["Meta Ads"] } },
        { otherServices: { $in: ["Other Services"] } }
      ]
    }).select(
      "_id businessName fullName mobileNumber city baName baId otherServices otherServicesOther"
    );

    res.status(200).json(records);
  } catch (error) {
    console.error("getDigitalMarketingBusinessOptions error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDigitalMarketingPlans = async (req, res) => {
  try {
    const plans = await DigitalMarketingPlanner.find().sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (error) {
    console.error("getDigitalMarketingPlans error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveDigitalMarketingPlan = async (req, res) => {
  try {
    const {
      formId,
      businessName,
      selectedServices,
      posterImagesRequired,
      reelsRequired,
      posterImagesDone,
      reelsDone,
      googleAdsCampaignStatus,
      googleAdsPriceDetails,
      metaAdsCampaignStatus,
      metaAdsPriceDetails,
      otherServiceDetails,
      otherServiceRequired,
      otherServiceDone
    } = req.body;

    if (!formId || !businessName) {
      return res.status(400).json({
        message: "Business selection is required"
      });
    }

    const newPlan = await DigitalMarketingPlanner.create({
      formId,
      businessName,
      assignedTo: req.user.id,
      selectedServices: Array.isArray(selectedServices) ? selectedServices : [],
      posterImagesRequired: Number(posterImagesRequired || 0),
      reelsRequired: Number(reelsRequired || 0),
      posterImagesDone: Number(posterImagesDone || 0),
      reelsDone: Number(reelsDone || 0),
      googleAdsCampaignStatus: googleAdsCampaignStatus || "",
      googleAdsPriceDetails: googleAdsPriceDetails || "",
      metaAdsCampaignStatus: metaAdsCampaignStatus || "",
      metaAdsPriceDetails: metaAdsPriceDetails || "",
      otherServiceDetails: otherServiceDetails || "",
      otherServiceRequired: otherServiceRequired || "",
      otherServiceDone: otherServiceDone || ""
    });

    res.status(201).json({
      message: "Digital marketing plan saved successfully",
      data: newPlan
    });
  } catch (error) {
    console.error("saveDigitalMarketingPlan error:", error);
    res.status(500).json({ message: error.message });
  }
};