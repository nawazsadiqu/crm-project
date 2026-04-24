import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/visitedAppointments.css";

const AppointmentVisitedPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [visitedAppointments, setVisitedAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchVisitedAppointments = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/presentation-details/visited-appointments?date=${selectedDate}`
      );

      setVisitedAppointments(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setVisitedAppointments([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch visited appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitedAppointments();
  }, [selectedDate]);

  return (
    <div className="visited-page">
      <div className="visited-card">
        <div className="visited-header">
          <div>
            <h2 className="visited-title">Visited Appointments</h2>
            <p className="visited-subtitle">
              Track completed appointments and verified visits
            </p>
          </div>
        </div>

        <div className="visited-top-bar">
          <div className="visited-filter-card">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="visited-actions">
            <button className="btn btn-primary" onClick={fetchVisitedAppointments}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="visited-message">{message}</p>}

        <div className="visited-summary-card">
          <div>
            <h3>Visited Records</h3>
            <p>Total visited appointments for selected date</p>
          </div>

          <span className="visited-count-badge">
            {visitedAppointments.length}
          </span>
        </div>

        {loading ? (
          <p className="visited-loading">Loading visited appointments...</p>
        ) : visitedAppointments.length === 0 ? (
          <p className="visited-empty">
            No visited appointments found for this date.
          </p>
        ) : (
          <div className="visited-table-wrapper">
            <table className="visited-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  <th>Response</th>
                  <th>Appointment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {visitedAppointments.map((item) => (
                  <tr key={item._id}>
                    <td>{item.date}</td>
                    <td>{item.businessName || "-"}</td>

                    <td>
                      {item.mapLink ? (
                        <a
                          href={item.mapLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{item.contact || "-"}</td>
                    <td>{item.response || "-"}</td>

                    <td>
                      <span
                        className={`visited-pill ${
                          item.isAppointment ? "yes" : "no"
                        }`}
                      >
                        {item.isAppointment ? "Yes" : "No"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`visited-status-pill ${
                          item.isVisitedAppointment ? "visited" : "not-visited"
                        }`}
                      >
                        {item.isVisitedAppointment ? "Visited" : "Not Visited"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="visited-bottom-actions">
  <Link to="/ba/appointments" className="btn btn-secondary">
    Back
  </Link>
</div>
    </div>
  );
};

export default AppointmentVisitedPage;