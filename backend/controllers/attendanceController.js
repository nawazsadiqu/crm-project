import Attendance from "../models/Attendance.js";
import EmployeeDetail from "../models/EmployeeDetail.js";

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const employees = await EmployeeDetail.find().sort({ name: 1 });
    const savedAttendance = await Attendance.find({ date });

    const attendanceMap = new Map();
    savedAttendance.forEach((item) => {
      attendanceMap.set(item.employeeId, item.status);
    });

    const mergedData = employees.map((employee) => ({
      employeeId: employee.employeeId,
      name: employee.name,
      position: employee.position || "",
      status: attendanceMap.get(employee.employeeId) || "Present"
    }));

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("getAttendanceByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveAttendanceByDate = async (req, res) => {
  try {
    const { date, attendance } = req.body;

    if (!date || !Array.isArray(attendance)) {
      return res.status(400).json({
        message: "Date and attendance list are required"
      });
    }

    for (const item of attendance) {
      await Attendance.findOneAndUpdate(
        {
          date,
          employeeId: item.employeeId
        },
        {
          date,
          employeeId: item.employeeId,
          employeeName: item.name,
          status: item.status
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    }

    res.status(200).json({ message: "Attendance saved successfully" });
  } catch (error) {
    console.error("saveAttendanceByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceSummaryByMonth = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const employees = await EmployeeDetail.find().sort({ name: 1 });
    const records = await Attendance.find({
      date: { $regex: `^${month}` }
    });

    const summaryMap = new Map();

    employees.forEach((employee) => {
      summaryMap.set(employee.employeeId, {
        employeeId: employee.employeeId,
        name: employee.name,
        position: employee.position || "",
        present: 0,
        absent: 0
      });
    });

    records.forEach((record) => {
      const existing = summaryMap.get(record.employeeId);

      if (existing) {
        if (record.status === "Present") {
          existing.present += 1;
        } else if (record.status === "Absent") {
          existing.absent += 1;
        }
      }
    });

    res.status(200).json(Array.from(summaryMap.values()));
  } catch (error) {
    console.error("getAttendanceSummaryByMonth error:", error);
    res.status(500).json({ message: error.message });
  }
};