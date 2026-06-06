import GmbQuery from "../models/GmbQuery.js";
import EmployeeDetail from "../models/EmployeeDetail.js";

export const getGmbQueries = async (req, res) => {
  try {
    const { status = "not done", month = "all" } = req.query;

    const filter = { status };

    if (month && month !== "all") {
      filter.date = { $regex: `^${month}` };
    }

    const records = await GmbQuery.find(filter).sort({
      date: -1,
      createdAt: -1
    });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGmbQuery = async (req, res) => {
  try {
    const {
      date,
      businessName,
      baName,
      comment,
      mapLink,
      contactNumber
    } = req.body;

    if (!date || !businessName) {
      return res.status(400).json({
        message: "Date and business name are required"
      });
    }

    const record = await GmbQuery.create({
      date,
      businessName,
      baName: baName || "",
      comment: comment || "",
      mapLink: mapLink || "",
      contactNumber: contactNumber || "",
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "GMB query added successfully",
      data: record
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGmbQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRecord = await GmbQuery.findByIdAndUpdate(
      id,
      {
        status,
        doneAt: status === "done" ? new Date() : null
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "GMB query not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGmbQuery = async (req, res) => {
  try {
    const { id } = req.params;

    await GmbQuery.findByIdAndDelete(id);

    res.status(200).json({
      message: "GMB query deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveBaListForGmbQueries = async (req, res) => {
  try {
    const baList = await EmployeeDetail.find({
  role: "ba",
  $or: [
    { status: "active" },
    { status: "Active" },
    { status: "" },
    { status: { $exists: false } }
  ]
})
  .select("name employeeId status")
  .sort({ name: 1 });

    res.status(200).json(baList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadGmbQueryCount = async (req, res) => {
  try {
    const employee = await EmployeeDetail.findOne({
      userId: req.user.id
    });

    const count = await GmbQuery.countDocuments({
      baName: employee?.name || "",
      status: "not done",
      readBy: { $ne: req.user.id }
    });

    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markGmbQueriesRead = async (req, res) => {
  try {
    const employee = await EmployeeDetail.findOne({
      userId: req.user.id
    });

    await GmbQuery.updateMany(
      {
        baName: employee?.name || "",
        status: "not done",
        readBy: { $ne: req.user.id }
      },
      {
        $addToSet: {
          readBy: req.user.id
        }
      }
    );

    res.status(200).json({
      message: "GMB queries marked as read"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};