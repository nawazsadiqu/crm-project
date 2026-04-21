import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/suspendedPage.css";

const SuspendedPage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchSuspendedPageBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/crm/suspended-page");

      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch suspended page businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspendedPageBusinesses();
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

      await api.post("/crm/suspended-page/comment", {
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
    <div className="suspended-page-page">
      <div className="suspended-page-card">
        <div className="suspended-page-header">
          <div>
            <h2 className="suspended-page-title">Suspended Page</h2>
            <p className="suspended-page-subtitle">
              Manage suspended page service records from BA Forms
            </p>
          </div>
        </div>

        <div className="suspended-page-top-bar">
          <div className="suspended-page-filter-box suspended-page-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, BA, email, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="suspended-page-actions">
            <button className="btn btn-primary" onClick={fetchSuspendedPageBusinesses}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="suspended-page-message">{message}</p>}

        <div className="suspended-page-summary-card">
          <div>
            <h3>Suspended Page Records</h3>
            <p>Businesses mapped from BA Forms</p>
          </div>

          <span className="suspended-page-count-badge">
            {filteredRecords.length}
          </span>
        </div>

        {loading ? (
          <p className="suspended-page-loading">Loading suspended page records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="suspended-page-empty">No suspended page businesses found.</p>
        ) : (
          <div className="suspended-page-table-wrapper">
            <table className="suspended-page-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>BA Name</th>
                  <th>Business Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>Mail ID</th>
                  <th>Status / Comment</th>
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
                        className="suspended-page-comment-box"
                        value={item.comment || ""}
                        onChange={(e) =>
                          handleCommentChange(item._id, e.target.value)
                        }
                        onBlur={() =>
                          handleCommentSave(item._id, item.comment)
                        }
                        placeholder="Enter status / comment..."
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

export default SuspendedPage;