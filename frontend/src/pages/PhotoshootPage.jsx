import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/photoshoot.css";

const PhotoshootPage = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("businessName-asc");
  const [cityFilter, setCityFilter] = useState("all");
  const [baFilter, setBaFilter] = useState("all");
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

  const uniqueCities = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(records.map((item) => (item.city || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b))
    ];
  }, [records]);

  const uniqueBaNames = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(records.map((item) => (item.baName || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b))
    ];
  }, [records]);

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
          item.baName
        ]
          .join(" ")
          .toLowerCase()
          .includes(lowerSearch)
      );
    }

    if (cityFilter !== "all") {
      updatedRecords = updatedRecords.filter(
        (item) => (item.city || "").trim() === cityFilter
      );
    }

    if (baFilter !== "all") {
      updatedRecords = updatedRecords.filter(
        (item) => (item.baName || "").trim() === baFilter
      );
    }

    switch (sortBy) {
      case "businessName-asc":
        updatedRecords.sort((a, b) =>
          (a.businessName || "").localeCompare(b.businessName || "")
        );
        break;
      case "businessName-desc":
        updatedRecords.sort((a, b) =>
          (b.businessName || "").localeCompare(a.businessName || "")
        );
        break;
      case "date-new":
        updatedRecords.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        break;
      case "date-old":
        updatedRecords.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        break;
      case "amount-high":
        updatedRecords.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
        break;
      case "amount-low":
        updatedRecords.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
        break;
      case "city-asc":
        updatedRecords.sort((a, b) =>
          (a.city || "").localeCompare(b.city || "")
        );
        break;
      case "baName-asc":
        updatedRecords.sort((a, b) =>
          (a.baName || "").localeCompare(b.baName || "")
        );
        break;
      default:
        break;
    }

    return updatedRecords;
  }, [records, searchTerm, sortBy, cityFilter, baFilter]);

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
                  <th>BA Name</th>
                  <th>Client Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Amount</th>
                  <th>Shoot Status</th>
                  <th>Upload Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSortedRecords.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.businessName || "-"}</td>
                    <td>{item.date || "-"}</td>
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