import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/photoshoot.css";

const PhotoshootPage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchPhotoshootBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/crm/photoshoot");

      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch photoshoot businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotoshootBusinesses();
  }, []);

  const handleStatusToggle = async (formId, currentStatus) => {
    const nextStatus = currentStatus === "Done" ? "Pending" : "Done";

    try {
      setSavingId(`shoot-${formId}`);

      await api.post("/crm/photoshoot/status", {
        formId,
        status: nextStatus
      });

      setRecords((prev) =>
        prev.map((item) =>
          item._id === formId ? { ...item, status: nextStatus } : item
        )
      );

      setMessage("Photoshoot status updated successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to update photoshoot status"
      );
    } finally {
      setSavingId("");
    }
  };

  const handleUploadStatusToggle = async (formId, currentUploadStatus) => {
    const nextUploadStatus =
      currentUploadStatus === "done" ? "pending" : "done";

    try {
      setSavingId(`upload-${formId}`);

      await api.post("/crm/photoshoot/status", {
        formId,
        uploadStatus: nextUploadStatus
      });

      setRecords((prev) =>
        prev.map((item) =>
          item._id === formId
            ? { ...item, uploadStatus: nextUploadStatus }
            : item
        )
      );

      setMessage("Upload status updated successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to update upload status"
      );
    } finally {
      setSavingId("");
    }
  };

  const handleCommentChange = (formId, value) => {
  setRecords((prev) =>
    prev.map((item) =>
      item._id === formId ? { ...item, photoshootComment: value } : item
    )
  );
};

const handleCommentSave = async (formId, photoshootComment) => {
  try {
    setSavingId(`comment-${formId}`);

    await api.put(`/crm/photoshoot/${formId}/comment`, {
      photoshootComment: photoshootComment || ""
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

  const filteredAndSortedRecords = useMemo(() => {
    let updatedRecords = [...records];

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      updatedRecords = updatedRecords.filter((item) =>
        [
          item.businessName,
          item.fullName,
          item.mobileNumber,
          item.city,
          item.area,
          item.baName,
          item.photoshootComment
        ]
          .join(" ")
          .toLowerCase()
          .includes(lowerSearch)
      );
    }

    if (statusFilter === "shootPending") {
  updatedRecords = updatedRecords.filter(
    (item) => (item.status || "Pending") !== "Done"
  );
}

if (statusFilter === "uploadPending") {
  updatedRecords = updatedRecords.filter(
    (item) => (item.uploadStatus || "pending") !== "done"
  );
}

if (statusFilter === "anyPending") {
  updatedRecords = updatedRecords.filter(
    (item) =>
      (item.status || "Pending") !== "Done" ||
      (item.uploadStatus || "pending") !== "done"
  );
}


    return updatedRecords;
  }, [records, searchTerm, statusFilter]);

  return (
    <div className="photoshoot-page">
      <div className="photoshoot-card">
        <div className="photoshoot-header">
          <div>
            <h2 className="photoshoot-title">Photoshoot</h2>
            <p className="photoshoot-subtitle">
              Manage photoshoot and upload status for businesses from BA Forms
            </p>
          </div>
        </div>

        <div className="photoshoot-top-bar">
          <div className="photoshoot-filter-box photoshoot-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, client, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="photoshoot-filter-box">
  <label>Status Filter</label>
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="all">All</option>
    <option value="shootPending">Shoot Pending</option>
    <option value="uploadPending">Upload Pending</option>
    <option value="anyPending">Any Pending</option>
  </select>
</div>

          <div className="photoshoot-actions">
            <button className="btn btn-primary" onClick={fetchPhotoshootBusinesses}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="photoshoot-message">{message}</p>}

        <div className="photoshoot-summary-card">
          <div>
            <h3>Photoshoot Businesses</h3>
            <p>Businesses mapped from BA Forms</p>
          </div>

          <span className="photoshoot-count-badge">
            {filteredAndSortedRecords.length}
          </span>
        </div>

        {loading ? (
          <p className="photoshoot-loading">Loading photoshoot records...</p>
        ) : filteredAndSortedRecords.length === 0 ? (
          <p className="photoshoot-empty">No photoshoot businesses found.</p>
        ) : (
          <div className="photoshoot-table-wrapper">
            <table className="photoshoot-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Business Name</th>
                  <th>Date</th>
                  <th>Shoot Status</th>
                  <th>Upload Status</th>
                  <th>Comment</th>
                  <th>BA Name</th>
                  <th>Client Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSortedRecords.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.businessName || "-"}</td>
                    <td>{item.date || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className={`photoshoot-switch ${
                          item.status === "Done" ? "done" : "pending"
                        }`}
                        onClick={() => handleStatusToggle(item._id, item.status)}
                        disabled={savingId === `shoot-${item._id}`}
                      >
                        <span className="photoshoot-switch-track">
                          <span className="photoshoot-switch-thumb" />
                        </span>
                        <span className="photoshoot-switch-text">
                          {item.status === "Done" ? "Done" : "Pending"}
                        </span>
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`photoshoot-switch ${
                          item.uploadStatus === "done" ? "done" : "pending"
                        }`}
                        onClick={() =>
                          handleUploadStatusToggle(
                            item._id,
                            item.uploadStatus || "pending"
                          )
                        }
                        disabled={savingId === `upload-${item._id}`}
                      >
                        <span className="photoshoot-switch-track">
                          <span className="photoshoot-switch-thumb" />
                        </span>
                        <span className="photoshoot-switch-text">
                          {item.uploadStatus === "done" ? "Done" : "Pending"}
                        </span>
                      </button>
                    </td>

                    <td>
  <textarea
    className="photoshoot-comment-input"
    value={item.photoshootComment || ""}
    onChange={(e) =>
      handleCommentChange(item._id, e.target.value)
    }
    onBlur={() =>
      handleCommentSave(item._id, item.photoshootComment)
    }
    placeholder="Add comment"
    disabled={savingId === `comment-${item._id}`}
  />
</td>
                    <td>{item.baName || "-"}</td>
                    <td>{item.fullName || "-"}</td>
                    <td>{item.mobileNumber || "-"}</td>
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
                    <td>{item.city || "-"}</td>
                    <td>{item.area || "-"}</td>
                    <td>₹{Number(item.amount || 0).toFixed(2)}</td>

                    
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

export default PhotoshootPage;