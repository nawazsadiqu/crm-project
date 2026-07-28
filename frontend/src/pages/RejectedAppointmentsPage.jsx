import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const RejectedAppointmentsPage = () => {
  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7);

  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth);

  const [
    rejectedAppointments,
    setRejectedAppointments
  ] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const fetchRejectedAppointments =
    async () => {
      try {
        setLoading(true);

        const { data } = await api.get(
          `/presentation-details/rejected-appointments?month=${selectedMonth}`
        );

        setRejectedAppointments(
          Array.isArray(data) ? data : []
        );

        setMessage("");
      } catch (error) {
        console.error(
          "Failed to fetch rejected appointments:",
          error
        );

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

  const filteredRejectedAppointments =
    rejectedAppointments.filter((item) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      return [
        item.date,
        item.appointmentDate,
        item.presentationNumber,
        item.status,
        item.rejectionReason,
        item.businessName,
        item.mapLink,
        item.contact,
        item.response,
        item.notes,
        item.visitedDate
      ]
        .map((value) =>
          String(value || "").toLowerCase()
        )
        .join(" ")
        .includes(search);
    });

  const getDisplayedStatus = (item) => {
  if (item.isVisitedNotInterested) {
    return (
      item.visitedRejectionReason ||
      "Not Interested"
    );
  }

  if (item.rejectedFromAppointment) {
    return (
      item.rejectionReason ||
      "Not Interested"
    );
  }

  return item.status || "Rejected";
};

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">
              Rejected Appointments
            </h2>

            <p className="appointments-subtitle">
              Rejected and Not Interested
              records from Presentation
            </p>
          </div>
        </div>

        <div className="appointments-top-bar">
          <div className="appointments-filter-card">
            <label>Select Month</label>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value
                )
              }
            />
          </div>

          <div className="appointments-filter-card appointments-search-card">
            <label>Search</label>

            <input
              type="text"
              placeholder="Search rejected records..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="appointments-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={
                fetchRejectedAppointments
              }
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {message && (
          <p className="appointments-message">
            {message}
          </p>
        )}

        <div className="appointments-summary-card">
          <div>
            <h3>Rejected Records</h3>

            <p>
              Rejected and Not Interested
              records for the selected month
            </p>
          </div>

          <span className="appointments-count-badge">
            {
              filteredRejectedAppointments.length
            }
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">
            Loading rejected records...
          </p>
        ) : filteredRejectedAppointments
            .length === 0 ? (
          <p className="appointments-empty">
            No rejected records found for
            this month.
          </p>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Appointment Date</th>
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
                {filteredRejectedAppointments.map(
                  (item) => (
                    <tr key={item._id}>
                      <td>
                        {item.date || "-"}
                      </td>

                      <td>
                        {item.appointmentDate ||
                          "-"}
                      </td>

                      <td>
                        {item.presentationNumber ??
                          "-"}
                      </td>

                      <td>
                        <span
                          className="status-pill"
                          style={{
                            background:
                              item.rejectedFromAppointment
                                ? "#fee2e2"
                                : "#fef3c7",

                            color:
                              item.rejectedFromAppointment
                                ? "#991b1b"
                                : "#92400e"
                          }}
                        >
                          {getDisplayedStatus(
                            item
                          )}
                        </span>
                      </td>

                      <td>
                        {item.businessName ||
                          "-"}
                      </td>

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

                      <td>
                        {item.contact || "-"}
                      </td>

                      <td>
                        {item.response || "-"}
                      </td>

                      <td>
                        {item.notes || "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="appointments-bottom-actions">
        <Link
          to="/ba/data-sheet"
          className="btn btn-secondary"
        >
          Back
        </Link>
      </div>
    </div>
  );
};

export default RejectedAppointmentsPage;