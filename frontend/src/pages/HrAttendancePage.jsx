import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrAttendance.css";

const HrAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceList, setAttendanceList] = useState([]);
  const [message, setMessage] = useState("");

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance?date=${selectedDate}`);
      setAttendanceList(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch attendance"
      );
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleToggleAttendance = (employeeId) => {
    setAttendanceList((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId
          ? {
              ...item,
              status: item.status === "Present" ? "Absent" : "Present"
            }
          : item
      )
    );
  };

  const handleSaveAttendance = async () => {
    try {
      await api.post("/attendance", {
        date: selectedDate,
        attendance: attendanceList
      });

      setMessage("Attendance saved successfully");
      fetchAttendance();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to save attendance"
      );
    }
  };

  return (
  <div className="hr-attendance-page">
    <div className="hr-attendance-card">
      
      {/* HEADER */}
      <div className="hr-attendance-header">
        <div>
          <h2 className="hr-attendance-title">Attendance Sheet</h2>
          <p className="hr-attendance-subtitle">
            Track daily employee attendance and update status
          </p>
        </div>
      </div>

      {/* DATE */}
      <div className="hr-attendance-topbar">
        <div className="hr-attendance-date-box">
          <label>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {message && <p className="hr-attendance-message">{message}</p>}

      {/* TABLE */}
      <div className="hr-attendance-table-section">
        <div className="hr-attendance-section-header">
          <h3>Attendance Records</h3>
          <span className="hr-attendance-count-badge">
            {attendanceList.length}
          </span>
        </div>

        {attendanceList.length === 0 ? (
          <p className="hr-attendance-empty">No employees found.</p>
        ) : (
          <div className="hr-attendance-table-wrapper">
            <table className="hr-attendance-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((item) => (
                  <tr key={item.employeeId}>
                    <td>{item.employeeId}</td>
                    <td>{item.name}</td>
                    <td>{item.position || "-"}</td>
                    <td>
                      <button
                        className={`attendance-toggle ${
                          item.status === "Present" ? "present" : "absent"
                        }`}
                        onClick={() =>
                          handleToggleAttendance(item.employeeId)
                        }
                      >
                        {item.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="hr-attendance-footer">
        <Link to="/hr/attendance-summary" className="btn btn-white">
          Attendance Summary
        </Link>

        <button className="btn btn-primary" onClick={handleSaveAttendance}>
          Save
        </button>

        <button className="btn btn-secondary" onClick={fetchAttendance}>
          Refresh
        </button>

        <Link to="/hr" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
  </div>
);
};

export default HrAttendancePage;