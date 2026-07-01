import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrAttendanceSummary.css";

const HrAttendanceSummaryPage = () => {
  const today = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(today);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [message, setMessage] = useState("");

  const fetchEmployees = async () => {
  try {
        const { data } = await api.get(`/employee-details`);

        const activeEmployees = Array.isArray(data)
          ? data.filter((emp) => (emp.status || "active") === "active")
          : [];

        setEmployeeList(activeEmployees);

        if (activeEmployees.length > 0 && !selectedEmployee) {
          setSelectedEmployee(activeEmployees[0].employeeId);
        }

        if (activeEmployees.length === 0) {
          setSelectedEmployee("");
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Failed to fetch employees"
        );
      }
    };

  const fetchEmployeeCalendar = async () => {
    if (!selectedEmployee) return;

    try {
      const { data } = await api.get(
        `/attendance/employee-calendar?employeeId=${selectedEmployee}&month=${selectedMonth}`
      );

      setAttendanceRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setAttendanceRecords([]);
      setMessage(
        error.response?.data?.message || "Failed to fetch attendance calendar"
      );
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchEmployeeCalendar();
  }, [selectedEmployee, selectedMonth]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceRecords.forEach((item) => {
      map[item.date] = item.status;
    });
    return map;
  }, [attendanceRecords]);

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      return {
        day,
        date,
        status: attendanceMap[date] || "Not Marked"
      };
    });
  }, [selectedMonth, attendanceMap]);

  const selectedEmployeeDetails = employeeList.find(
    (emp) => emp.employeeId === selectedEmployee
  );

  const summary = useMemo(() => {
    return calendarDays.reduce(
      (acc, day) => {
        if (day.status === "Present") acc.present += 1;
        else if (day.status === "Absent") acc.absent += 1;
        else if (day.status === "Half Day") acc.halfDay += 1;
        else acc.notMarked += 1;

        return acc;
      },
      {
        present: 0,
        absent: 0,
        halfDay: 0,
        notMarked: 0
      }
    );
  }, [calendarDays]);

  return (
    <div className="hr-summary-page">
      <div className="hr-summary-card">
        <div className="hr-summary-header">
          <div>
            <h2 className="hr-summary-title">Attendance Calendar</h2>
            <p className="hr-summary-subtitle">
              Select employee and view monthly attendance calendar
            </p>
          </div>
        </div>

        <div className="hr-summary-topbar">
          <div className="hr-summary-month-box">
            <label>Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employeeList.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeId} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hr-summary-month-box">
            <label>Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        {message && <p className="hr-summary-message">{message}</p>}

        {selectedEmployeeDetails && (
          <div className="hr-summary-employee-card">
            <h3>
              {selectedEmployeeDetails.employeeId} -{" "}
              {selectedEmployeeDetails.name}
            </h3>
            <p>{selectedEmployeeDetails.position || "-"}</p>
          </div>
        )}

        <div className="hr-summary-stats-grid">
          <div className="hr-summary-stat present-text">
            Present: {summary.present}
          </div>
          <div className="hr-summary-stat absent-text">
            Absent: {summary.absent}
          </div>
          <div className="hr-summary-stat halfday-text">
            Half Day: {summary.halfDay}
          </div>
          <div className="hr-summary-stat notmarked-text">
            Not Marked: {summary.notMarked}
          </div>
        </div>

        <div className="attendance-calendar-grid">
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={`attendance-calendar-day ${
                day.status === "Present"
                  ? "calendar-present"
                  : day.status === "Absent"
                  ? "calendar-absent"
                  : day.status === "Half Day"
                  ? "calendar-halfday"
                  : "calendar-notmarked"
              }`}
            >
              <strong>{day.day}</strong>
              <span>{day.status}</span>
            </div>
          ))}
        </div>

        <div className="hr-summary-footer">
          <button
            className="btn btn-secondary"
            onClick={fetchEmployeeCalendar}
          >
            Refresh
          </button>

          <Link to="/hr/attendance" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HrAttendanceSummaryPage;