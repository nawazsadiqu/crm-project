import EmployeeDetail from "../models/EmployeeDetail.js";
import FormDetail from "../models/FormDetail.js";

// format JS date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// get date range for daily / weekly / monthly
const getDateRange = (type, date) => {
  const d = new Date(date);

  let startDate, endDate;

  if (type === "daily") {
    startDate = new Date(d);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "weekly") {
    const temp = new Date(d);
    const day = temp.getDay(); // Sunday = 0

    startDate = new Date(temp);
    startDate.setDate(temp.getDate() - day);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "monthly") {
    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// GET all BA employees for dropdown
export const getAdminBaList = async (req, res) => {
  try {
    const baEmployees = await EmployeeDetail.find({ role: "ba" })
      .select("employeeId name userId role")
      .sort({ name: 1 });

    res.status(200).json(baEmployees);
  } catch (error) {
    console.error("Error fetching BA list:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET business details based on BA + filter
export const getAdminBusinessDetails = async (req, res) => {
  try {
    const { userId, type, date } = req.query;

    if (!userId || !type) {
      return res.status(400).json({
        message: "userId and type are required"
      });
    }

    let filter = { userId };

    if (type !== "all") {
      if (!date) {
        return res.status(400).json({
          message: "date is required for daily, weekly, and monthly filters"
        });
      }

      const { startDate, endDate } = getDateRange(type, date);

      const selectedDateString = formatDate(date);
      const weekStartString = formatDate(startDate);
      const weekEndString = formatDate(endDate);

      const selectedDate = new Date(date);
      const monthString = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (type === "daily") {
        filter.date = selectedDateString;
      } else if (type === "weekly") {
        filter.date = {
          $gte: weekStartString,
          $lte: weekEndString
        };
      } else if (type === "monthly") {
        filter.date = { $regex: `^${monthString}` };
      }
    }

    const businessData = await FormDetail.find(filter).sort({ date: -1 });

    res.status(200).json(businessData);
  } catch (error) {
    console.error("Error fetching admin business details:", error);
    res.status(500).json({ message: error.message });
  }
};