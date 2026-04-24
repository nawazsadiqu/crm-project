import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const CallbackAppointmentsPage = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [callbackAppointments, setCallbackAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCallbackAppointments = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/presentation-details/callback-appointments?month=${selectedMonth}`
      );

      setCallbackAppointments(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setCallbackAppointments([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch callback appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallbackAppointments();
  }, [selectedMonth]);

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">Callback Appointments</h2>
            <p className="appointments-subtitle">
              CBC and CBA records from Presentation
            </p>
          </div>
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
              onClick={fetchCallbackAppointments}
            >
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="appointments-message">{message}</p>}

        <div className="appointments-summary-card">
          <div>
            <h3>Callback Records</h3>
            <p>Records found for the selected month</p>
          </div>
          <span className="appointments-count-badge">
            {callbackAppointments.length}
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">Loading callback records...</p>
        ) : callbackAppointments.length === 0 ? (
          <p className="appointments-empty">
            No callback records found for this month.
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
                {callbackAppointments.map((item) => (
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
      <div className="appointments-bottom-actions">
  <Link to="/ba/data-sheet" className="btn btn-secondary">
    Back
  </Link>
</div>
    </div>
  );
};

export default CallbackAppointmentsPage;