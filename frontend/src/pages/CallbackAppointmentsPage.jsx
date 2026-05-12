import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const CallbackAppointmentsPage = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
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

  const handleBusinessClick = (item) => {
  navigate("/ba/tmc", {
    state: {
      callbackAppointment: {
        businessName: item.businessName,
        mapLink: item.mapLink,
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

const filteredCallbackAppointments = callbackAppointments.filter((item) => {
  const search = searchTerm.toLowerCase();

  return (
    item.businessName?.toLowerCase().includes(search) ||
    item.contact?.toLowerCase().includes(search) ||
    item.mapLink?.toLowerCase().includes(search) ||
    item.callbackDate?.toLowerCase().includes(search) ||
    item.date?.toLowerCase().includes(search) ||
    String(item.presentationNumber || "").toLowerCase().includes(search) ||
    notesData[item._id]?.toLowerCase().includes(search)
  );
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
            <div className="appointments-filter-card">
  <label>Search</label>
  <input
    type="text"
    placeholder="Search name, number, map, notes..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
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
                  <th>Presentation No</th>
                  
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  
                  <th>Notes</th>
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
                    <td>{item.callbackDate || "-"}</td>
                    <td>{item.presentationNumber ?? "-"}</td>
                    
                    <td>{item.businessName || "-"}</td>
                    <td>
                      {item.mapLink ? (
                        <a
  href={item.mapLink}
  target="_blank"
  rel="noreferrer"
  onClick={(e) => e.stopPropagation()}
>
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