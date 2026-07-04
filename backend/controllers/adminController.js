import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import EmployeeDetail from "../models/EmployeeDetail.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const activeEmployees = await EmployeeDetail.find({
      $or: [
        { status: "active" },
        { status: "Active" },
        { status: "" },
        { status: { $exists: false } }
      ]
    });

    const activeUserIds = activeEmployees
      .map((employee) => employee.userId)
      .filter(Boolean);

    const totalUsers = activeEmployees.length;

    let totalHR = 0;
    let totalBA = 0;

    if (activeUserIds.length > 0) {
      totalHR = await User.countDocuments({
        _id: { $in: activeUserIds },
        role: "hr"
      });

      totalBA = await User.countDocuments({
        _id: { $in: activeUserIds },
        role: "ba"
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalHR,
        totalBA
      }
    });
  } catch (error) {
    console.error("getAdminDashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const employeeDetails = await EmployeeDetail.find({
      userId: { $exists: true, $ne: null },
      employeeId: { $exists: true, $nin: ["", null] },
      name: { $exists: true, $nin: ["", null] }
    }).lean();

    const userIds = employeeDetails
      .map((employee) => employee.userId)
      .filter(Boolean);

    const users = await User.find({
      _id: { $in: userIds }
    })
      .select("-password")
      .lean();

    const userMap = new Map();

    users.forEach((user) => {
      userMap.set(String(user._id), user);
    });

    const finalUsers = employeeDetails
      .map((employee) => {
        const user = userMap.get(String(employee.userId));

        if (!user) return null;

        const employeeStatus = employee.status || "active";

        return {
          ...user,

          employeeId: employee.employeeId || "",
          employeeName: employee.name || user.name || "",
          name: employee.name || user.name || "",
          position: employee.position || "",
          phone: employee.phone || employee.mobileNumber || employee.contactNumber || "",
          employeeStatus,
          isActive:
            employeeStatus === "active" ||
            employeeStatus === "Active" ||
            !employeeStatus
        };
      })
      .filter(Boolean);

    finalUsers.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      return String(a.employeeName || a.name || "").localeCompare(
        String(b.employeeName || b.name || "")
      );
    });

    res.json({
      success: true,
      count: finalUsers.length,
      users: finalUsers
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceOverview = async (req, res) => {
  try {
    const activeEmployees = await EmployeeDetail.find({
      $or: [
        { status: "active" },
        { status: "Active" },
        { status: "" },
        { status: { $exists: false } }
      ]
    }).select("employeeId");

    const activeEmployeeIds = activeEmployees
      .map((employee) => employee.employeeId)
      .filter(Boolean);

    const data = await Attendance.find({
      employeeId: { $in: activeEmployeeIds }
    }).sort({ date: -1 });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("ADMIN ATTENDANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};