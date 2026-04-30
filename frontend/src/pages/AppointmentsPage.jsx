import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const AppointmentsPage = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/presentation-details/appointments?month=${selectedMonth}`
      );

      setAppointments(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setAppointments([]);
      setMessage(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedMonth]);

  const handleVisitedChange = async (id, currentValue, visitedDate = "") => {
  try {
    await api.put(`/presentation-details/appointments/${id}/visit-status`, {
      isVisitedAppointment: !currentValue,
      visitedDate: !currentValue ? visitedDate : ""
    });

    setMessage("Visited appointment status updated successfully");
    fetchAppointments();
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Failed to update visited appointment status"
    );
  }
};

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">Appointments</h2>
            <p className="appointments-subtitle">
              Appointment Fixed records from Presentation
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
            <button className="btn btn-primary" onClick={fetchAppointments}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="appointments-message">{message}</p>}

        <div className="appointments-summary-card">
          <div>
            <h3>Appointment Records</h3>
            <p>Records found for the selected month</p>
          </div>
          <span className="appointments-count-badge">
            {appointments.length}
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="appointments-empty">
            No appointments found for this month.
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
                  <th>Visited</th>
                  <th>Visited Date</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((item) => (
                  <tr key={item._id}>
                    <td>{item.date}</td>
                    <td>{item.presentationNumber ?? "-"}</td>
                    <td>
                      <span className="status-pill appointment-fixed">
                        {item.status || "Appointment Fixed"}
                      </span>
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
                    <td>
  <div className="notes-cell">
    {item.notes || "-"}
  </div>
</td>
                    <td>
                      <label className="visited-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={!!item.isVisitedAppointment}
                          onChange={() =>
                            handleVisitedChange(
                              item._id,
                              item.isVisitedAppointment
                            )
                          }
                        />
                        <span>
                          {item.isVisitedAppointment
                            ? "Visited"
                            : "Not Visited"}
                        </span>
                      </label>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.visitedDate || ""}
                        disabled={!item.isVisitedAppointment}
                        onChange={async (e) => {
                        await api.put(`/presentation-details/appointments/${item._id}/visit-status`, {
                        isVisitedAppointment: true,
                        visitedDate: e.target.value
                          });

                        fetchAppointments();
                        }}
                        className="visited-date-input"
                        />
                      </td>
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

export default AppointmentsPage;