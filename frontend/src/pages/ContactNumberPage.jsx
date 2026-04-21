import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/contactNumber.css";

const ContactNumberPage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchContactNumberBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/crm/contact-number");

      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch contact number businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactNumberBusinesses();
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

      await api.post("/crm/contact-number/comment", {
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
    <div className="contact-number-page">
      <div className="contact-number-card">
        <div className="contact-number-header">
          <div>
            <h2 className="contact-number-title">Contact Number</h2>
            <p className="contact-number-subtitle">
              Manage contact number service records from BA Forms
            </p>
          </div>
        </div>

        <div className="contact-number-top-bar">
          <div className="contact-number-filter-box contact-number-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, BA, email, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="contact-number-actions">
            <button className="btn btn-primary" onClick={fetchContactNumberBusinesses}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="contact-number-message">{message}</p>}

        <div className="contact-number-summary-card">
          <div>
            <h3>Contact Number Records</h3>
            <p>Businesses mapped from BA Forms</p>
          </div>

          <span className="contact-number-count-badge">
            {filteredRecords.length}
          </span>
        </div>

        {loading ? (
          <p className="contact-number-loading">Loading contact number records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="contact-number-empty">No contact number businesses found.</p>
        ) : (
          <div className="contact-number-table-wrapper">
            <table className="contact-number-table">
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
                        className="contact-number-comment-box"
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

export default ContactNumberPage;