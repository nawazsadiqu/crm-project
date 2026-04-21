import FormDetail from "../models/FormDetail.js";
import WebsiteProjectPlanner from "../models/WebsiteProjectPlanner.js";

export const getWebsiteBusinesses = async (req, res) => {
  try {
    const records = await FormDetail.find({
      otherServices: "Website"
    }).sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error("getWebsiteBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getWebsiteBusinessOptions = async (req, res) => {
  try {
    const records = await FormDetail.find({
      otherServices: "Website"
    }).select("_id businessName fullName mobileNumber city baName baId");

    res.status(200).json(records);
  } catch (error) {
    console.error("getWebsiteBusinessOptions error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getWebsiteProjects = async (req, res) => {
  try {
    const projects = await WebsiteProjectPlanner.find()
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error("getWebsiteProjects error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveWebsiteProject = async (req, res) => {
  try {
    const { formId, businessName, startDate, endDate } = req.body;

    if (!formId || !businessName || !startDate || !endDate) {
      return res.status(400).json({
        message: "Business, start date and end date are required"
      });
    }

    const newProject = await WebsiteProjectPlanner.create({
      formId,
      businessName,
      assignedTo: req.user.id,
      startDate,
      endDate
    });

    res.status(201).json({
      message: "Website project plan saved successfully",
      data: newProject
    });
  } catch (error) {
    console.error("saveWebsiteProject error:", error);
    res.status(500).json({ message: error.message });
  }
};