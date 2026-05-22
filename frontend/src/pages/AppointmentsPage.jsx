import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const AppointmentsPage = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
  try {
    setLoading(true);

    const url =
      activeTab === "all"
        ? "/presentation-details/appointments?all=true"
        : `/presentation-details/appointments?month=${selectedMonth}`;

    const { data } = await api.get(url);

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
}, [selectedMonth, activeTab]);

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

const handleDeleteAppointment = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this appointment?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`/presentation-details/${id}`);
    setMessage("Appointment deleted successfully");
    fetchAppointments();
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to delete appointment"
    );
  }
};

const handleBusinessClick = (item) => {
  navigate("/ba/tmc", {
    state: {
      returnTo: "/ba/appointments",
      callingData: {
        businessName: item.businessName || "",
        mapLink: item.mapLink || "",
        contactNumber: item.contact || "",
        mobileNumber: item.contact || "",
        date: item.date || "",
        presentationId: item._id
      }
    }
  });
};

const getWeeksInMonth = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const weeks = [];
  let start = new Date(firstDay);
  let weekNumber = 1;

  while (start <= lastDay) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (end > lastDay) {
      end.setTime(lastDay.getTime());
    }

    const format = (dateObj) => dateObj.toISOString().split("T")[0];

    weeks.push({
      key: `week-${weekNumber}`,
      label: `Week ${weekNumber}`,
      startDate: format(start),
      endDate: format(end)
    });

    start = new Date(end);
    start.setDate(start.getDate() + 1);
    weekNumber++;
  }

  return weeks;
};

const monthWeeks = getWeeksInMonth(selectedMonth);

const getVisibleAppointments = () => {
  let list = [...appointments];

  if (activeTab !== "all") {
    const selectedWeek = monthWeeks.find((week) => week.key === activeTab);

    if (selectedWeek) {
      list = list.filter(
        (item) =>
        item.date >= selectedWeek.startDate &&
        item.date <= selectedWeek.endDate
      );
    }
  }

  if (activeTab === "all") {
    const today = new Date().toISOString().split("T")[0];

    list.sort((a, b) => {
      const aVisited = !!a.isVisitedAppointment;
      const bVisited = !!b.isVisitedAppointment;

      if (aVisited !== bVisited) {
        return aVisited ? 1 : -1;
      }

      const aDate = a.appointmentDate || "9999-12-31";
      const bDate = b.appointmentDate || "9999-12-31";

      const aPast = aDate < today;
      const bPast = bDate < today;

      if (aPast !== bPast) {
        return aPast ? 1 : -1;
      }

      return aDate.localeCompare(bDate);
    });
  }

  return list;
};

const visibleAppointments = getVisibleAppointments();

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

        <div className="appointments-week-tabs">
  <button
    type="button"
    className={`appointments-week-tab ${activeTab === "all" ? "active" : ""}`}
    onClick={() => setActiveTab("all")}
  >
    All Appointments
  </button>

  {monthWeeks.map((week) => (
    <button
      key={week.key}
      type="button"
      className={`appointments-week-tab ${
        activeTab === week.key ? "active" : ""
      }`}
      onClick={() => setActiveTab(week.key)}
    >
      {week.label}
    </button>
  ))}
</div>

        {message && <p className="appointments-message">{message}</p>}

        <div className="appointments-summary-card">
          <div>
            <h3>Appointment Records</h3>
            <p>Records found for the selected month</p>
          </div>
          <span className="appointments-count-badge">
            {visibleAppointments.length}
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">Loading appointments...</p>
        ) : visibleAppointments.length === 0 ? (
          <p className="appointments-empty">
            No appointments found for this month.
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
                  <th>Notes</th>
                  <th>Response</th>
                  <th>Visited</th>
                  <th>Visited Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleAppointments.map((item) => (
                  <tr key={item._id}>
                    <td>{item.date}</td>
                    <td>
                    <input
                      type="date"
                      value={item.appointmentDate || ""}
                      onChange={(e) => {
                      const updated = [...appointments];
                      const index = updated.findIndex((a) => a._id === item._id);

                      if (index !== -1) {
                      updated[index].appointmentDate = e.target.value;
                      setAppointments(updated);
                      }
                }}
                onBlur={async () => {
                try {
                  await api.put(
                    `/presentation-details/appointments/${item._id}/appointment-date`,
                    {appointmentDate: item.appointmentDate}
                  );

                setMessage("Appointment date updated successfully");
                } catch (error) {
                setMessage("Failed to update appointment date");
              }
            }}
              className="visited-date-input"/>
              </td>
                    <td>{item.presentationNumber ?? "-"}</td>
                    <td>
                      <span className="status-pill appointment-fixed">
                        {item.status || "Appointment Fixed"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="business-name-link" onClick={() => handleBusinessClick(item)}>
                        {item.businessName || "-"}
                      </button>
                    </td>
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
                    {/* <td>{item.response || "-"}</td> */}
                    <td>
  <textarea
    value={item.notes || ""}
    onChange={(e) => {
      const updated = [...appointments];
      const index = updated.findIndex((a) => a._id === item._id);
      updated[index].notes = e.target.value;
      setAppointments(updated);
    }}
    onBlur={async () => {
      try {
        await api.put(`/presentation-details/appointments/${item._id}/notes`, {
          notes: item.notes,
        });
        setMessage("Notes updated successfully");
      } catch (error) {
        setMessage("Failed to update notes");
      }
    }}
    className="editable-textarea"
    placeholder="Enter notes"
  />
</td>
<td>
  <textarea
    value={item.response || ""}
    onChange={(e) => {
      const updated = [...appointments];
      const index = updated.findIndex((a) => a._id === item._id);

      if (index !== -1) {
        updated[index].response = e.target.value;
        setAppointments(updated);
      }
    }}
    onBlur={async () => {
      try {
        await api.put(
          `/presentation-details/appointments/${item._id}/response`,
          {
            response: item.response
          }
        );

        setMessage("Response updated successfully");
      } catch (error) {
        setMessage("Failed to update response");
      }
    }}
    className="editable-textarea"
    placeholder="Enter response"
  />
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
                      <td>
  <button
    className="btn btn-danger"
    onClick={() => handleDeleteAppointment(item._id)}
  >
    Delete
  </button>
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