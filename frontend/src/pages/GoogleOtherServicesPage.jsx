import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/googleOtherServices.css";

const GoogleOtherServicesPage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchGoogleOtherServiceBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/crm/google-other-services");

      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch Google other service businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleOtherServiceBusinesses();
  }, []);

  const handleCommentChange = (formId, value) => {
    setRecords((prev) =>
      prev.map((item) =>
        item._id === formId ? { ...item, comment: value } : item
      )
    );
  };

  const handleCommentSave = async (formId, comment) => {
    try {
      setSavingId(formId);

      await api.post("/crm/google-other-services/comment", {
        formId,
        comment
      });

      setMessage("Comment saved successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to save comment"
      );
    } finally {
      setSavingId("");
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;

    const lowerSearch = searchTerm.toLowerCase();

    return records.filter((item) =>
      [
        item.date,
        item.baName,
        item.businessName,
        item.contactNumber,
        item.email,
        item.googleOtherService
      ]
        .join(" ")
        .toLowerCase()
        .includes(lowerSearch)
    );
  }, [records, searchTerm]);

  return (
    <div className="google-other-services-page">
      <div className="google-other-services-card">
        <div className="google-other-services-header">
          <div>
            <h2 className="google-other-services-title">Google Other Services</h2>
            <p className="google-other-services-subtitle">
              Manage businesses using the Others option under Google Services
            </p>
          </div>
        </div>

        <div className="google-other-services-top-bar">
          <div className="google-other-services-filter-box google-other-services-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, BA, email, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="google-other-services-actions">
            <button className="btn btn-primary" onClick={fetchGoogleOtherServiceBusinesses}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="google-other-services-message">{message}</p>}

        <div className="google-other-services-summary-card">
          <div>
            <h3>Google Other Service Records</h3>
            <p>Businesses mapped from BA Forms</p>
          </div>

          <span className="google-other-services-count-badge">
            {filteredRecords.length}
          </span>
        </div>

        {loading ? (
          <p className="google-other-services-loading">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="google-other-services-empty">
            No Google other service businesses found.
          </p>
        ) : (
          <div className="google-other-services-table-wrapper">
            <table className="google-other-services-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>BA Name</th>
                  <th>Business Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>Mail ID</th>
                  <th>Other Google Service</th>
                  <th>CRM Remarks</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.date || "-"}</td>
                    <td>{item.baName || "-"}</td>
                    <td>{item.businessName || "-"}</td>
                    <td>{item.contactNumber || "-"}</td>
                    <td>
                      {item.googleMapLink ? (
                        <a
                          href={item.googleMapLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{item.email || "-"}</td>
                    <td>{item.googleOtherService || "-"}</td>
                    <td>
                      <textarea
                        className="google-other-services-comment-box"
                        value={item.comment || ""}
                        onChange={(e) =>
                          handleCommentChange(item._id, e.target.value)
                        }
                        onBlur={() =>
                          handleCommentSave(item._id, item.comment)
                        }
                        placeholder="Enter CRM remarks..."
                        disabled={savingId === item._id}
                      />
                    </td>
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

export default GoogleOtherServicesPage;