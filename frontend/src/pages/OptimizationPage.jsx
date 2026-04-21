import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/optimization.css";

const OptimizationPage = () => {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
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
  const [dailyUpdateCount, setDailyUpdateCount] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const fetchOptimizationBusinesses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/crm/optimization?date=${selectedDate}`);

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
  }, [selectedDate]);

 const handleStatusToggle = async (formId, currentStatus, currentNature) => {
  const nextStatus = currentStatus === "Updated" ? "Pending" : "Updated";

  try {
    setSavingId(formId);

    const response = await api.post("/crm/optimization/weekly-status", {
      formId,
      weeklyUpdateStatus: nextStatus,
      natureOfBusiness: currentNature || "",
      date: selectedDate
    });

    console.log("weekly-status response:", response.data);

    setRecords((prev) =>
      prev.map((item) =>
        item._id === formId
          ? { ...item, weeklyUpdateStatus: nextStatus }
          : item
      )
    );

    await fetchDailyUpdateCount();
    setMessage("Weekly update status saved successfully");
  } catch (error) {
    console.error("weekly-status error:", error.response?.data || error.message);
    setMessage(
      error.response?.data?.message ||
        "Failed to save weekly update status"
    );
  } finally {
    setSavingId("");
  }
};

  const handleNatureSave = async (formId, currentStatus, natureOfBusiness) => {
    try {
      setSavingId(formId);

      await api.post("/crm/optimization/weekly-status", {
        formId,
        weeklyUpdateStatus: currentStatus || "Pending",
        natureOfBusiness: natureOfBusiness || "",
        date: selectedDate
      });

      setMessage("Nature of business saved successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to save nature of business"
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
          item.natureOfBusiness
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
        updatedRecords.sort((a, b) =>
          (b.date || "").localeCompare(a.date || "")
        );
        break;
      case "date-old":
        updatedRecords.sort((a, b) =>
          (a.date || "").localeCompare(b.date || "")
        );
        break;
      case "amount-high":
        updatedRecords.sort(
          (a, b) => Number(b.amount || 0) - Number(a.amount || 0)
        );
        break;
      case "amount-low":
        updatedRecords.sort(
          (a, b) => Number(a.amount || 0) - Number(b.amount || 0)
        );
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
      case "nature-asc":
        updatedRecords.sort((a, b) =>
          (a.natureOfBusiness || "").localeCompare(b.natureOfBusiness || "")
        );
        break;
      case "nature-desc":
        updatedRecords.sort((a, b) =>
          (b.natureOfBusiness || "").localeCompare(a.natureOfBusiness || "")
        );
        break;
      default:
        break;
    }

    return updatedRecords;
  }, [records, searchTerm, sortBy, cityFilter, baFilter]);

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

          <div className="optimization-filter-box optimization-search-box">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by business, client, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* <div className="optimization-filter-box optimization-combined-filter-box">
            <label>Filter</label>
            <div className="optimization-combined-filter-grid">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="businessName-asc">Business Name A-Z</option>
                <option value="businessName-desc">Business Name Z-A</option>
                <option value="date-new">Date New to Old</option>
                <option value="date-old">Date Old to New</option>
                <option value="amount-high">Amount High to Low</option>
                <option value="amount-low">Amount Low to High</option>
                <option value="city-asc">City A-Z</option>
                <option value="baName-asc">BA Name A-Z</option>
                <option value="nature-asc">Nature A-Z</option>
                <option value="nature-desc">Nature Z-A</option>
              </select>

              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city === "all" ? "All Cities" : city}
                  </option>
                ))}
              </select>

              <select
                value={baFilter}
                onChange={(e) => setBaFilter(e.target.value)}
              >
                {uniqueBaNames.map((ba) => (
                  <option key={ba} value={ba}>
                    {ba === "all" ? "All BA Names" : ba}
                  </option>
                ))}
              </select>
            </div>
          </div> */}

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
                  <th>Date</th>
                  <th>BA Name</th>
                  <th>Client Name</th>
                  <th>Contact Number</th>
                  <th>Map Link</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Amount</th>
                  <th>Nature of Business</th>
                  <th>Status</th>
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
                      <input
                        type="text"
                        className="optimization-nature-input"
                        value={item.natureOfBusiness || ""}
                        onChange={(e) =>
                          handleNatureChange(item._id, e.target.value)
                        }
                        onBlur={() =>
                          handleNatureSave(
                            item._id,
                            item.weeklyUpdateStatus,
                            item.natureOfBusiness
                          )
                        }
                        placeholder="e.g. PG, Spa"
                        disabled={savingId === item._id}
                      />
                    </td>
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
                            item.weeklyUpdateStatus,
                            item.natureOfBusiness
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