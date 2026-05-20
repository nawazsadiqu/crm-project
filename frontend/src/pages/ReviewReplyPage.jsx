import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/optimization.css";

const ReviewReplyPage = () => {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [weekInfo, setWeekInfo] = useState({
    weekKey: "",
    weekStartDate: "",
    weekEndDate: ""
  });

  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [weeklyReplyCount, setWeeklyReplyCount] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchReviewReplyBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/crm/review-reply?date=${selectedDate}`);

      setWeekInfo({
        weekKey: data.weekKey || "",
        weekStartDate: data.weekStartDate || "",
        weekEndDate: data.weekEndDate || ""
      });

      setRecords(Array.isArray(data.records) ? data.records : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch review reply businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReplyCount = async () => {
    try {
      const { data } = await api.get(
        `/crm/review-reply/weekly-count?date=${selectedDate}`
      );

      setWeeklyReplyCount(Number(data.weeklyReplyCount || 0));
    } catch (error) {
      setWeeklyReplyCount(0);
    }
  };

  const refreshPageData = async () => {
    await Promise.all([
      fetchReviewReplyBusinesses(),
      fetchWeeklyReplyCount()
    ]);
  };

  useEffect(() => {
    refreshPageData();
  }, [selectedDate]);

  const handleStatusToggle = async (formId, currentStatus) => {
    const nextStatus = currentStatus === "Replied" ? "Pending" : "Replied";

    try {
      setSavingId(formId);

      await api.post("/crm/review-reply/weekly-status", {
        formId,
        weeklyReplyStatus: nextStatus,
        date: selectedDate
      });

      setRecords((prev) =>
        prev.map((item) =>
          item._id === formId
            ? { ...item, weeklyReplyStatus: nextStatus }
            : item
        )
      );

      await fetchWeeklyReplyCount();
      setMessage("Review reply status saved successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to save review reply status"
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
          item.natureOfBusiness,
          item.optimizationComment
        ]
          .join(" ")
          .toLowerCase()
          .includes(lowerSearch)
      );
    }

    if (statusFilter !== "all") {
      updatedRecords = updatedRecords.filter(
        (item) => (item.weeklyReplyStatus || "Pending") === statusFilter
      );
    }

    return updatedRecords;
  }, [records, searchTerm, statusFilter]);

  return (
    <div className="optimization-page">
      <div className="optimization-card">
        <div className="optimization-header">
          <div>
            <h2 className="optimization-title">Review Reply</h2>
            <p className="optimization-subtitle">
              Manage weekly review reply updates for Optimization businesses
            </p>
          </div>
        </div>

        <div className="optimization-top-bar">
          <div className="optimization-filter-box">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="optimization-week-box">
            <label>Selected Week</label>
            <div className="optimization-week-range">
              {weekInfo.weekStartDate && weekInfo.weekEndDate
                ? `${weekInfo.weekStartDate} to ${weekInfo.weekEndDate}`
                : "-"}
            </div>
          </div>

          <div className="optimization-filter-box optimization-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, client, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="optimization-filter-box">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Replied">Replied</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="optimization-actions">
            <button className="btn btn-primary" onClick={refreshPageData}>
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="optimization-message">{message}</p>}

        <div className="optimization-stats-row">
          <div className="optimization-summary-card">
            <div>
              <h3>Review Reply Businesses</h3>
              <p>Businesses mapped from BA Forms where service is Optimization</p>
            </div>

            <span className="optimization-count-badge">
              {filteredAndSortedRecords.length}
            </span>
          </div>

          <div className="optimization-summary-card optimization-daily-card">
            <div>
              <h3>Selected Week Replies</h3>
              <p>Total businesses marked Replied in the selected week</p>
            </div>

            <span className="optimization-count-badge">
              {weeklyReplyCount}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="optimization-loading">
            Loading review reply records...
          </p>
        ) : filteredAndSortedRecords.length === 0 ? (
          <p className="optimization-empty">
            No review reply businesses found.
          </p>
        ) : (
          <div className="optimization-table-wrapper">
            <table className="optimization-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Business Name</th>
                  <th>Status</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>BA Name</th>
                  <th>Client Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Amount</th>
                  <th>Nature of Business</th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSortedRecords.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>

                    <td>{item.businessName || "-"}</td>

                    <td>
                      <button
                        type="button"
                        className={`optimization-switch ${
                          item.weeklyReplyStatus === "Replied"
                            ? "updated"
                            : "pending"
                        }`}
                        onClick={() =>
                          handleStatusToggle(
                            item._id,
                            item.weeklyReplyStatus
                          )
                        }
                        disabled={savingId === item._id}
                      >
                        <span className="optimization-switch-track">
                          <span className="optimization-switch-thumb" />
                        </span>

                        <span className="optimization-switch-text">
                          {item.weeklyReplyStatus === "Replied"
                            ? "Replied"
                            : "Pending"}
                        </span>
                      </button>
                    </td>

                    <td>
                      <textarea
                        className="optimization-comment-input"
                        value={item.optimizationComment || ""}
                        placeholder="Optimization comment"
                        readOnly
                      />
                    </td>

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
                    <td>{item.natureOfBusiness || "-"}</td>
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

export default ReviewReplyPage;