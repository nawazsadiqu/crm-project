import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/optimization.css";

const OptimizationPage = () => {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(
  new Date().toISOString().slice(0, 7)
);
  const [weekInfo, setWeekInfo] = useState({
    weekKey: "",
    weekStartDate: "",
    weekEndDate: ""
  });

  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("businessName-asc");
  const [cityFilter, setCityFilter] = useState("all");
  const [baFilter, setBaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dailyUpdateCount, setDailyUpdateCount] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchOptimizationBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
      `/crm/optimization?date=${selectedDate}&month=${selectedMonth}`
      );

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
          "Failed to fetch optimization businesses"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyUpdateCount = async () => {
  try {
    const { data } = await api.get(
      `/crm/optimization/daily-count?date=${selectedDate}`
    );

    setDailyUpdateCount(Number(data.weeklyUpdateCount || 0));
  } catch (error) {
    setDailyUpdateCount(0);
  }
};

  const refreshPageData = async () => {
    await Promise.all([
      fetchOptimizationBusinesses(),
      fetchDailyUpdateCount()
    ]);
  };

  useEffect(() => {
    refreshPageData();
  }, [selectedDate, selectedMonth]);

 const handleStatusToggle = async (formId, currentStatus) => {
  const nextStatus = currentStatus === "Updated" ? "Pending" : "Updated";

  try {
    setSavingId(formId);

    await api.post("/crm/optimization/weekly-status", {
      formId,
      weeklyUpdateStatus: nextStatus,
      date: selectedDate
    });

    setRecords((prev) =>
      prev.map((item) =>
        item._id === formId
          ? { ...item, weeklyUpdateStatus: nextStatus }
          : item
      )
    );

    await fetchDailyUpdateCount();
    setMessage("Status saved successfully");
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to save status"
    );
  } finally {
    setSavingId("");
  }
};

  const handlePermanentDetailsSave = async (
  formId,
  natureOfBusiness,
  optimizationComment
) => {
  try {
    setSavingId(formId);

    await api.put(`/crm/optimization/${formId}/permanent-details`, {
      natureOfBusiness: natureOfBusiness || "",
      optimizationComment: optimizationComment || ""
    });

    setMessage("Details saved permanently");
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to save permanent details"
    );
  } finally {
    setSavingId("");
  }
};

  const handleNatureChange = (formId, value) => {
    setRecords((prev) =>
      prev.map((item) =>
        item._id === formId ? { ...item, natureOfBusiness: value } : item
      )
    );
  };

  const handleCommentChange = (formId, value) => {
  setRecords((prev) =>
    prev.map((item) =>
      item._id === formId
        ? { ...item, optimizationComment: value }
        : item
    )
  );
};

  const uniqueCities = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(
          records
            .map((item) => (item.city || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b))
    ];
  }, [records]);

  const uniqueBaNames = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(
          records
            .map((item) => (item.baName || "").trim())
            .filter(Boolean)
        )
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
      (item) => (item.weeklyUpdateStatus || "Pending") === statusFilter
    );
  }

  return updatedRecords;
}, [records, searchTerm, statusFilter]);

  return (
    <div className="optimization-page">
      <div className="optimization-card">
        <div className="optimization-header">
          <div>
            <h2 className="optimization-title">Optimization</h2>
            <p className="optimization-subtitle">
              Manage weekly optimization updates for businesses from BA Forms
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

          <div className="optimization-filter-box">
            <label>Select Month</label>
            <input
  type="month"
  value={selectedMonth}
  onChange={(e) => setSelectedMonth(e.target.value)}
/>
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
    <option value="Updated">Uploaded</option>
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
              <h3>Optimization Businesses</h3>
              <p>Businesses mapped from BA Forms for the selected week</p>
            </div>

            <span className="optimization-count-badge">
              {filteredAndSortedRecords.length}
            </span>
          </div>

          <div className="optimization-summary-card optimization-daily-card">
            <div>
              <h3>Selected Week Updates</h3>
              <p>Total businesses marked Updated in the selected week</p>
            </div>

            <span className="optimization-count-badge">
              {dailyUpdateCount}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="optimization-loading">Loading optimization records...</p>
        ) : filteredAndSortedRecords.length === 0 ? (
          <p className="optimization-empty">No optimization businesses found.</p>
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
                          item.weeklyUpdateStatus === "Updated"
                            ? "updated"
                            : "pending"
                        }`}
                        onClick={() =>
                          handleStatusToggle(
                            item._id,
                            item.weeklyUpdateStatus
                          )
                        }
                        disabled={savingId === item._id}
                      >
                        <span className="optimization-switch-track">
                          <span className="optimization-switch-thumb" />
                        </span>
                        <span className="optimization-switch-text">
                          {item.weeklyUpdateStatus === "Updated"
                            ? "Updated"
                            : "Pending"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <textarea
                        className="optimization-comment-input"
                        value={item.optimizationComment || ""}
                        onChange={(e) =>
                        handleCommentChange(item._id, e.target.value)
                        }
                        onBlur={() =>
                        handlePermanentDetailsSave(
                        item._id,
                        item.natureOfBusiness,
                        item.optimizationComment
                        )
                        }
                        placeholder="Add comment"
                        disabled={savingId === item._id}
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
                    <td>
                      <input
                        type="text"
                        className="optimization-nature-input"
                        value={item.natureOfBusiness || ""}
                        onChange={(e) =>
                          handleNatureChange(item._id, e.target.value)
                        }
                        onBlur={() =>
                        handlePermanentDetailsSave(
                        item._id,
                        item.natureOfBusiness,
                        item.optimizationComment
                        )
                        }
                        placeholder="e.g. PG, Spa"
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

export default OptimizationPage;