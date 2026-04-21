import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrAttendanceSummary.css";

const HrAttendanceSummaryPage = () => {
  const today = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(today);
  const [summaryList, setSummaryList] = useState([]);
  const [message, setMessage] = useState("");

  const fetchSummary = async () => {
    try {
      const { data } = await api.get(
        `/attendance/summary?month=${selectedMonth}`
      );
      setSummaryList(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch attendance summary"
      );
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  return (
    <div className="hr-summary-page">
      <div className="hr-summary-card">
        {/* HEADER */}
        <div className="hr-summary-header">
          <div>
            <h2 className="hr-summary-title">Attendance Summary</h2>
            <p className="hr-summary-subtitle">
              View monthly attendance performance of employees
            </p>
          </div>
        </div>

        {/* MONTH SELECT */}
        <div className="hr-summary-topbar">
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

        {/* TABLE */}
        <div className="hr-summary-table-section">
          <div className="hr-summary-section-header">
            <h3>Monthly Summary</h3>
            <span className="hr-summary-count">
              {summaryList.length}
            </span>
          </div>

          {summaryList.length === 0 ? (
            <p className="hr-summary-empty">
              No attendance summary found.
            </p>
          ) : (
            <div className="hr-summary-table-wrapper">
              <table className="hr-summary-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Total Present</th>
                    <th>Total Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryList.map((item) => (
                    <tr key={item.employeeId}>
                      <td>{item.employeeId}</td>
                      <td>{item.name}</td>
                      <td>{item.position || "-"}</td>
                      <td className="present-text">{item.present}</td>
                      <td className="absent-text">{item.absent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="hr-summary-footer">
          <button className="btn btn-secondary" onClick={fetchSummary}>
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