import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/pageHandling.css";

const PageHandlingPage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchPageHandlingBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/crm/page-handling");

      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch page handling businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageHandlingBusinesses();
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

      await api.post("/crm/page-handling/comment", {
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
    <div className="page-handling-page">
      <div className="page-handling-card">
        <div className="page-handling-header">
          <div>
            <h2 className="page-handling-title">Page Handling</h2>
            <p className="page-handling-subtitle">
              Manage page handling records from BA Forms
            </p>
          </div>
        </div>

        <div className="page-handling-top-bar">
          <div className="page-handling-filter-box page-handling-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, BA, email, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="page-handling-actions">
            <button className="btn btn-primary" onClick={fetchPageHandlingBusinesses}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="page-handling-message">{message}</p>}

        <div className="page-handling-summary-card">
          <div>
            <h3>Page Handling Records</h3>
            <p>Businesses mapped from BA Forms</p>
          </div>

          <span className="page-handling-count-badge">
            {filteredRecords.length}
          </span>
        </div>

        {loading ? (
          <p className="page-handling-loading">Loading page handling records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="page-handling-empty">No page handling businesses found.</p>
        ) : (
          <div className="page-handling-table-wrapper">
            <table className="page-handling-table">
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
                        className="page-handling-comment-box"
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

export default PageHandlingPage;