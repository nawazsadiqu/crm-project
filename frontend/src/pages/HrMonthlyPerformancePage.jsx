import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const HrMonthlyPerformancePage = () => {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [performanceList, setPerformanceList] = useState([]);
  const [message, setMessage] = useState("");

  const fetchPerformance = async () => {
    try {
      const { data } = await api.get(
        `/hr-performance?month=${selectedMonth}`
      );
      setPerformanceList(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch monthly performance"
      );
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [selectedMonth]);

  return (
    <div className="page-center">
      <div className="form-card long">
        <div className="page-header-row">
          <h1>Monthly Performance</h1>

          <div className="save-row">
            <button className="btn btn-secondary" onClick={fetchPerformance}>
              Refresh
            </button>

            <Link to="/hr" className="btn btn-secondary">
              Back
            </Link>
          </div>
        </div>

        <label>Select Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />

        {message && <p>{message}</p>}

        <hr style={{ margin: "20px 0" }} />

        <h2>Employee Monthly Performance</h2>

        {performanceList.length === 0 ? (
          <p>No performance data found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="presentation-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Position</th>
                  <th>Calls</th>
                  <th>Presentations</th>
                  <th>Appointment Fixed</th>
                  <th>Appointment Visited</th>
                  <th>Forms</th>
                  <th>Revenue</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                </tr>
              </thead>
              <tbody>
                {performanceList.map((item, index) => (
                  <tr key={item.employeeId || index}>
                    <td>{item.name}</td>
                    <td>{item.employeeId}</td>
                    <td>{item.role}</td>
                    <td>{item.position || "-"}</td>
                    <td>{item.calls}</td>
                    <td>{item.presentations}</td>
                    <td>{item.appointmentsFixed}</td>
                    <td>{item.appointmentsVisited}</td>
                    <td>{item.forms}</td>
                    <td>{item.revenue}</td>
                    <td>{item.presentDays}</td>
                    <td>{item.absentDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HrMonthlyPerformancePage;