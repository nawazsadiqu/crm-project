import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/gmbProfile.css";

const GmbProfilePage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchGmbProfileBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/crm/gmb-profile");

      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch GMB profile businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGmbProfileBusinesses();
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

      await api.post("/crm/gmb-profile/comment", {
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
        item.email
      ]
        .join(" ")
        .toLowerCase()
        .includes(lowerSearch)
    );
  }, [records, searchTerm]);

  return (
    <div className="gmb-profile-page">
      <div className="gmb-profile-card">
        <div className="gmb-profile-header">
          <div>
            <h2 className="gmb-profile-title">GMB Profile</h2>
            <p className="gmb-profile-subtitle">
              Manage GMB profile records from BA Forms
            </p>
          </div>
        </div>

        <div className="gmb-profile-top-bar">
          <div className="gmb-profile-filter-box gmb-profile-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, BA, email, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="gmb-profile-actions">
            <button className="btn btn-primary" onClick={fetchGmbProfileBusinesses}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="gmb-profile-message">{message}</p>}

        <div className="gmb-profile-summary-card">
          <div>
            <h3>GMB Profile Records</h3>
            <p>Businesses mapped from BA Forms</p>
          </div>

          <span className="gmb-profile-count-badge">
            {filteredRecords.length}
          </span>
        </div>

        {loading ? (
          <p className="gmb-profile-loading">Loading GMB profile records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="gmb-profile-empty">No GMB profile businesses found.</p>
        ) : (
          <div className="gmb-profile-table-wrapper">
            <table className="gmb-profile-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>BA Name</th>
                  <th>Business Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>Mail ID</th>
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
                    <td>
                      <textarea
                        className="gmb-profile-comment-box"
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

export default GmbProfilePage;