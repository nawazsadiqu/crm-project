import User from "../models/User.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHR = await User.countDocuments({ role: "hr" });
    const totalBA = await User.countDocuments({ role: "ba" });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalHR,
        totalBA
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Attendance from "../models/Attendance.js";

export const getAttendanceOverview = async (req, res) => {
  try {
    const data = await Attendance.find().sort({ date: -1 });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("ADMIN ATTENDANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};