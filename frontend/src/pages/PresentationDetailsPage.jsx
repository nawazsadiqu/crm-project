import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "../css/presentationDetails.css";

const PresentationDetailsPage = () => {
  const location = useLocation();

  const navigate = useNavigate();

  const presentationNumberRef = useRef(null);
const statusRef = useRef(null);
const businessNameRef = useRef(null);
const mapLinkRef = useRef(null);
const contactRef = useRef(null);
const appointmentDateRef = useRef(null);
const callbackDateRef = useRef(null);
const notesRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];
  const routeState = location.state || {};

  const passedData = location.state || {};

  const returnTo = routeState.returnTo || "";

  const [selectedDate, setSelectedDate] = useState(routeState.date || today);

  const [formData, setFormData] = useState({
    presentationNumber: routeState.presentationNumber || "",
    businessName: "",
    mapLink: "",
    contact: "",
    response: "",
    status: routeState.status || "",
    appointmentDate: "",
callbackDate: "",
    notes: ""
  });

  const [savedPresentations, setSavedPresentations] = useState([]);
  const [message, setMessage] = useState("");

  const fetchSavedPresentations = async () => {
    try {
      const { data } = await api.get(
        `/presentation-details?date=${selectedDate}`
      );

      setSavedPresentations(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setSavedPresentations([]);
      setMessage("Failed to fetch presentation details");
    }
  };

  useEffect(() => {
  if (passedData.notes) {
    setFormData((prev) => ({
      ...prev,
      businessName: extractFromNote("Business Name", passedData.notes),
      contact: extractFromNote("Contact Number", passedData.notes),
      mapLink: extractFromNote("Map Link", passedData.notes),
      notes: "",
      date: passedData.date || prev.date,
      presentationNumber:
        passedData.presentationNumber || prev.presentationNumber,
      status: passedData.status || prev.status
    }));
  }
}, []);

const extractFromNote = (label, text) => {
  const line = text.split("\n").find((l) => l.includes(label));
  return line ? line.split(":").slice(1).join(":").trim() : "";
};

  useEffect(() => {
    fetchSavedPresentations();
  }, [selectedDate]);

  useEffect(() => {
    if (routeState?.date || routeState?.presentationNumber || routeState?.status || routeState?.notes) {
      setSelectedDate(routeState.date || today);
      setFormData((prev) => ({
        ...prev,
        presentationNumber: routeState.presentationNumber || "",
        status: routeState.status || "",
        notes: ""
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const focusField = (fieldRef) => {
  const element = fieldRef?.current;

  if (!element) return;

  const y =
    element.getBoundingClientRect().top +
    window.pageYOffset -
    140;

  window.scrollTo({
    top: y,
    behavior: "smooth"
  });

  setTimeout(() => {
    element.focus();
  }, 500);
};

const validatePresentationForm = () => {
  if (!String(formData.presentationNumber || "").trim()) {
    setMessage("Please enter presentation number");
    focusField(presentationNumberRef);
    return false;
  }

  if (!String(formData.status || "").trim()) {
    setMessage("Please select presentation status");
    focusField(statusRef);
    return false;
  }

  if (!String(formData.businessName || "").trim()) {
    setMessage("Please enter business name");
    focusField(businessNameRef);
    return false;
  }

  if (!String(formData.mapLink || "").trim()) {
    setMessage("Please enter map link");
    focusField(mapLinkRef);
    return false;
  }

  if (!String(formData.contact || "").trim()) {
    setMessage("Please enter contact number");
    focusField(contactRef);
    return false;
  }

  if (formData.status === "Appointment Fixed") {
    if (!String(formData.appointmentDate || "").trim()) {
      setMessage("Please select appointment date");
      focusField(appointmentDateRef);
      return false;
    }
  }

  if (formData.status === "CBA" || formData.status === "CBC") {
    if (!String(formData.callbackDate || "").trim()) {
      setMessage("Please select callback date");
      focusField(callbackDateRef);
      return false;
    }
  }

  if (!String(formData.notes || "").trim()) {
    setMessage("Please enter response");
    focusField(notesRef);
    return false;
  }

  return true;
};

  const handleSave = async () => {
  if (!validatePresentationForm()) return;

  try {
      await api.post("/presentation-details", {
        date: selectedDate,
        presentationNumber: formData.presentationNumber,
        businessName: formData.businessName,
        mapLink: formData.mapLink,
        contact: formData.contact,
        response: formData.response,
        status: formData.status,
        appointmentDate: formData.appointmentDate,
callbackDate: formData.callbackDate,
        notes: formData.notes
      });

      setMessage("Presentation details saved successfully");

      setFormData({
  presentationNumber: "",
  businessName: "",
  mapLink: "",
  contact: "",
  response: "",
  status: "",
  appointmentDate: "",
  callbackDate: "",
  notes: ""
});

      if (returnTo) {
  navigate(returnTo, { replace: true });
} else {
  navigate("/ba/calling-data", { replace: true });
}

      fetchSavedPresentations();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to save presentation details"
      );
    }
  };

  const handleRefresh = () => {
    fetchSavedPresentations();
  };

  return (
    <div className="presentation-details-page">
      <div className="presentation-details-card">
        <div className="presentation-details-header">
          <div>
            <h2 className="presentation-details-title">Presentation Details</h2>
            <p className="presentation-details-subtitle">
              Save daily presentation records and track status-based outcomes
            </p>
          </div>
        </div>

        <div className="presentation-details-top-grid">
          <div className="presentation-filter-card">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {message && <p className="presentation-message">{message}</p>}

        <div className="presentation-form-card">
          <div className="presentation-form-grid">
            <div className="presentation-field">
              <label>Presentation Number</label>
              <input
                type="number"
                name="presentationNumber"
                value={formData.presentationNumber}
                onChange={handleChange}
                placeholder="Enter presentation number"
              />
            </div>

            <div className="presentation-field">
              <label>Status</label>
              <input
                ref={statusRef}
                type="text"
                name="status"
                value={formData.status}
                onChange={handleChange}
                placeholder="Selected status"
                readOnly
              />
            </div>

            <div className="presentation-field">
              <label>Business Name</label>
              <input
                ref={businessNameRef}
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>

            <div className="presentation-field">
              <label>Map Link</label>
              <input
                ref={mapLinkRef}
                type="text"
                name="mapLink"
                value={formData.mapLink}
                onChange={handleChange}
              />
            </div>

            <div className="presentation-field">
              <label>Contact</label>
              <input
                ref={contactRef}
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
              />
            </div>

            {formData.status === "Appointment Fixed" && (
            <div className="presentation-field">
              <label>Appointment Date</label>
              <input
                ref={appointmentDateRef}
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
              />
            </div>
            )}

            {(formData.status === "CBA" ||
            formData.status === "CBC") && (
            <div className="presentation-field">
              <label>Callback Date</label>
              <input
                ref={callbackDateRef}
                type="date"
                name="callbackDate"
                value={formData.callbackDate}
                onChange={handleChange}
              />
            </div>
            )}

            <div className="presentation-field full-width">
              <label>Response</label>
              <textarea
                className="presentation-response-box"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter notes..."
              />
            </div>
          </div>

          <div className="presentation-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>

            <button className="btn btn-secondary" onClick={handleRefresh}>
              Refresh
            </button>
          </div>
        </div>

        <div className="presentation-records-section">
          <div className="presentation-records-header">
            <h3>Saved Presentation Records</h3>
            <span className="records-badge">{savedPresentations.length}</span>
          </div>

          {savedPresentations.length === 0 ? (
            <p className="presentation-empty">No records found for this date.</p>
          ) : (
            <div className="presentation-table-wrapper">
              <table className="presentation-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Appointment Date</th>
                    <th>Callback Date</th>
                    <th>Presentation No</th>
                    <th>Status</th>
                    <th>Business Name</th>
                    <th>Map Link</th>
                    <th>Contact</th>
                    
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {savedPresentations.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>{item.date}</td>
                      <td>{item.appointmentDate || "-"}</td>
<td>{item.callbackDate || "-"}</td>
                      <td>{item.presentationNumber ?? "-"}</td>
                      <td>{item.status || "-"}</td>
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
                      
                      <td>{item.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="presentation-bottom-actions">
  <Link to="/ba/data-sheet" className="btn btn-secondary">
    Back
  </Link>
</div>
      </div>
    </div>
  );
};

export default PresentationDetailsPage;