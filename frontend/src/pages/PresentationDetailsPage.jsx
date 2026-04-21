import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "../css/presentationDetails.css";

const PresentationDetailsPage = () => {
  const location = useLocation();

  const today = new Date().toISOString().split("T")[0];
  const routeState = location.state || {};

  const [selectedDate, setSelectedDate] = useState(routeState.date || today);

  const [formData, setFormData] = useState({
    presentationNumber: routeState.presentationNumber || "",
    businessName: "",
    mapLink: "",
    contact: "",
    response: "",
    status: routeState.status || "",
    notes: routeState.notes || ""
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
    fetchSavedPresentations();
  }, [selectedDate]);

  useEffect(() => {
    if (routeState?.date || routeState?.presentationNumber || routeState?.status || routeState?.notes) {
      setSelectedDate(routeState.date || today);
      setFormData((prev) => ({
        ...prev,
        presentationNumber: routeState.presentationNumber || "",
        status: routeState.status || "",
        notes: routeState.notes || ""
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

  const handleSave = async () => {
    try {
      await api.post("/presentation-details", {
        date: selectedDate,
        presentationNumber: formData.presentationNumber,
        businessName: formData.businessName,
        mapLink: formData.mapLink,
        contact: formData.contact,
        response: formData.response,
        status: formData.status,
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
        notes: ""
      });

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

          <Link to="/ba/data-sheet" className="btn btn-secondary">
            Back
          </Link>
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

          <div className="presentation-filter-card">
            <label>Date</label>
            <input type="text" value={selectedDate} readOnly />
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
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>

            <div className="presentation-field">
              <label>Map Link</label>
              <input
                type="text"
                name="mapLink"
                value={formData.mapLink}
                onChange={handleChange}
              />
            </div>

            <div className="presentation-field">
              <label>Contact</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
              />
            </div>

            <div className="presentation-field full-width">
              <label>Response</label>
              <textarea
                className="presentation-response-box"
                name="response"
                value={formData.response}
                onChange={handleChange}
                placeholder="Enter response details..."
              />
            </div>

            <div className="presentation-field full-width">
              <label>Notes</label>
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
                  {savedPresentations.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>{item.date}</td>
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
    </div>
  );
};

export default PresentationDetailsPage;