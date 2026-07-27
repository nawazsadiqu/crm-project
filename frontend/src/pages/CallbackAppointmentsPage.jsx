import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const CALLBACK_APPOINTMENT_MONTH_KEY = "callbackAppointmentSelectedMonth";

const CallbackAppointmentsPage = () => {

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(
    sessionStorage.getItem(CALLBACK_APPOINTMENT_MONTH_KEY) || currentMonth
  );
  const [callbackAppointments, setCallbackAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notesData, setNotesData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  const fetchCallbackAppointments = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/presentation-details/callback-appointments?month=${selectedMonth}`
      );

      setCallbackAppointments(Array.isArray(data) ? data : []);
      const notesObj = {};
      (Array.isArray(data) ? data : []).forEach((item) => {
        notesObj[item._id] = item.notes || "";
        });
      setNotesData(notesObj);
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

  useEffect(() => {
  sessionStorage.setItem(CALLBACK_APPOINTMENT_MONTH_KEY, selectedMonth);
  }, [selectedMonth]);

  const handleBusinessClick = (item) => {
  navigate("/ba/tmc", {
    state: {
      returnTo: "/ba/callback-appointments",

      callbackAppointment: {
        businessName: item.businessName || "",
        mapLink: item.mapLink || "",
        contactNumber: item.contact || "",
      },
    },
  });
};

const handleNotesChange = async (id, value) => {
  setNotesData((prev) => ({
    ...prev,
    [id]: value,
  }));

  try {
    await api.put(
      `/presentation-details/callback-appointments/${id}/notes`,
      {
        notes: value,
      }
    );
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Failed to update notes"
    );
  }
};

const handleCallbackDateChange = async (id, value) => {
  setCallbackAppointments((prev) =>
    prev.map((item) =>
      item._id === id
        ? {
            ...item,
            callbackDate: value,
          }
        : item
    )
  );

  try {
    await api.put(
      `/presentation-details/callback-appointments/${id}/callback-date`,
      {
        callbackDate: value,
      }
    );
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Failed to update callback date"
    );
  }
};

const handleDeleteCallbackAppointment = async (id, businessName) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${
      businessName || "this callback appointment"
    }?`
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`/presentation-details/${id}`);

    setCallbackAppointments((prev) =>
      prev.filter((item) => item._id !== id)
    );

    setNotesData((prev) => {
      const updatedNotes = { ...prev };
      delete updatedNotes[id];
      return updatedNotes;
    });

    setMessage("Callback appointment deleted successfully");
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Failed to delete callback appointment"
    );
  }
};

const filteredCallbackAppointments = callbackAppointments
  .filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.businessName?.toLowerCase().includes(search) ||
      item.contact?.toLowerCase().includes(search) ||
      item.mapLink?.toLowerCase().includes(search) ||
      item.callbackDate?.toLowerCase().includes(search) ||
      item.date?.toLowerCase().includes(search) ||
      item.status?.toLowerCase().includes(search) ||
      String(item.presentationNumber || "").toLowerCase().includes(search) ||
      notesData[item._id]?.toLowerCase().includes(search)
    );
  })
  .sort((a, b) => {
    const today = new Date().toISOString().split("T")[0];

    const aDate = a.callbackDate || "";
    const bDate = b.callbackDate || "";

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aIsFutureOrToday = aDate >= today;
    const bIsFutureOrToday = bDate >= today;

    if (aIsFutureOrToday && !bIsFutureOrToday) return -1;
    if (!aIsFutureOrToday && bIsFutureOrToday) return 1;

    if (aIsFutureOrToday && bIsFutureOrToday) {
      return aDate.localeCompare(bDate);
    }

    return bDate.localeCompare(aDate);
  });
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

          <div className="appointments-filter-card appointments-search-card">
            <label>Search</label>
              <input
                type="text"
                placeholder="Search name, number, map, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredCallbackAppointments.length}
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">Loading callback records...</p>
        ) : filteredCallbackAppointments.length === 0 ? (
          <p className="appointments-empty">
            No callback records found for this month.
          </p>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>CallBack Date</th>
                  <th>Pr No</th>
                  <th>Status</th>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th> 
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCallbackAppointments.map((item) => (
                  <tr
                    key={item._id}
                    className="clickable-row"
                    onClick={() => handleBusinessClick(item)}
                  >
                    <td>{item.date}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={item.callbackDate || ""}
                      onChange={(e) =>
                      handleCallbackDateChange(item._id, e.target.value)
                      }
                      className="appointment-date-input"
                    />
                    </td>
                    <td>{item.presentationNumber ?? "-"}</td>
                    <td>
                      <span style={{padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: item.status === "CBA" ? "#dbeafe" : "#fef3c7", color: item.status === "CBA" ? "#1d4ed8" : "#92400e"}}>
                        {item.status || "-"}
                      </span>
                    </td>
                    <td>{item.businessName || "-"}</td>
                    <td>
                      {item.mapLink ? (
                        <a href={item.mapLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          Open Map
                        </a>
                        ) : (
                        "-"
                        )}
                    </td>
                    <td>{item.contact || "-"}</td>
                    
                    <td onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={notesData[item._id] || ""}
                        onChange={(e) => handleNotesChange(item._id, e.target.value)}
                        className="appointment-notes-input"
                        placeholder="Add notes"
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-danger callback-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();

                        handleDeleteCallbackAppointment(
                          item._id,
                          item.businessName
                        );
                      }}
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

export default CallbackAppointmentsPage;