import EmployeeDetail from "../models/EmployeeDetail.js";
import TmcLog from "../models/TmcLog.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import Attendance from "../models/Attendance.js";

export const getMonthlyPerformance = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const employees = await EmployeeDetail.find().sort({ name: 1 });

    const performanceData = await Promise.all(
      employees.map(async (employee) => {
        if (!employee.userId) {
          return {
            userId: null,
            employeeId: employee.employeeId,
            name: employee.name,
            role: employee.role,
            position: employee.position || "",
            calls: 0,
            presentations: 0,
            appointmentsFixed: 0,
            appointmentsVisited: 0,
            forms: 0,
            revenue: 0,
            presentDays: 0,
            absentDays: 0
          };
        }

        const tmcLogs = await TmcLog.find({
          userId: employee.userId,
          date: { $regex: `^${month}` }
        });

        const presentationDetails = await PresentationDetail.find({
          userId: employee.userId,
          date: { $regex: `^${month}` }
        });

        const formDetails = await FormDetail.find({
          userId: employee.userId,
          date: { $regex: `^${month}` }
        });

        const attendanceRecords = await Attendance.find({
          employeeId: employee.employeeId,
          date: { $regex: `^${month}` }
        });

        const calls = tmcLogs.reduce(
          (sum, item) => sum + (item.calls?.length || 0),
          0
        );

        const presentations = tmcLogs.reduce(
          (sum, item) => sum + (item.presentations?.length || 0),
          0
        );

        const appointmentsFixed = presentationDetails.filter(
          (item) => item.isAppointment === true
        ).length;

        const appointmentsVisited = presentationDetails.filter(
          (item) => item.isVisitedAppointment === true
        ).length;

        const forms = formDetails.length;

        const revenue = formDetails.reduce(
          (sum, item) => sum + Number(item.revenue || 0),
          0
        );

        const presentDays = attendanceRecords.filter(
          (item) => item.status === "Present"
        ).length;

        const absentDays = attendanceRecords.filter(
          (item) => item.status === "Absent"
        ).length;

        return {
          userId: employee.userId,
          employeeId: employee.employeeId,
          name: employee.name,
          role: employee.role,
          position: employee.position || "",
          calls,
          presentations,
          appointmentsFixed,
          appointmentsVisited,
          forms,
          revenue,
          presentDays,
          absentDays
        };
      })
    );

    res.status(200).json(performanceData);
  } catch (error) {
    console.error("getMonthlyPerformance error:", error);
    res.status(500).json({ message: error.message });
  }
};