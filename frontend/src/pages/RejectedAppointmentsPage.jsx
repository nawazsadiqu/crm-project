import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const RejectedAppointmentsPage = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [rejectedAppointments, setRejectedAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRejectedAppointments = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/presentation-details/rejected-appointments?month=${selectedMonth}`
      );

      setRejectedAppointments(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRejectedAppointments([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch rejected appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedAppointments();
  }, [selectedMonth]);

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">Rejected Appointments</h2>
            <p className="appointments-subtitle">
              Rejected records from Presentation
            </p>
          </div>

          <Link to="/ba/data-sheet" className="btn btn-secondary">
            Back
          </Link>
        </div>

        <div className="appointments-top-bar">
          <div className="appointments-filter-card">
            <label>Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="appointments-actions">
            <button
              className="btn btn-primary"
              onClick={fetchRejectedAppointments}
            >
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="appointments-message">{message}</p>}

        <div className="appointments-summary-card">
          <div>
            <h3>Rejected Records</h3>
            <p>Records found for the selected month</p>
          </div>
          <span className="appointments-count-badge">
            {rejectedAppointments.length}
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">Loading rejected records...</p>
        ) : rejectedAppointments.length === 0 ? (
          <p className="appointments-empty">
            No rejected records found for this month.
          </p>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Presentation No</th>
                  <th>Status</th>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  <th>Response</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {rejectedAppointments.map((item) => (
                  <tr key={item._id}>
                    <td>{item.date}</td>
                    <td>{item.presentationNumber ?? "-"}</td>
                    <td>
                      <span className="status-pill">{item.status || "-"}</span>
                    </td>
                    <td>{item.businessName || "-"}</td>
                    <td>
                      {item.mapLink ? (
                        <a href={item.mapLink} target="_blank" rel="noreferrer">
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{item.contact || "-"}</td>
                    <td>{item.response || "-"}</td>
                    <td>{item.notes || "-"}</td>
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

export default RejectedAppointmentsPage;