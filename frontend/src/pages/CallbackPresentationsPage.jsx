import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/callbackPresentations.css";

const CBP_FILTER_STORAGE_KEY = "cbpFilters";

const CallbackPresentationsPage = () => {
  const navigate = useNavigate();

  const savedFilters = JSON.parse(
    sessionStorage.getItem(CBP_FILTER_STORAGE_KEY) || "{}"
  );

  const [records, setRecords] = useState([]);

  const [saveTimers, setSaveTimers] = useState({});
  const [search, setSearch] = useState("");

  const [viewMode, setViewMode] = useState(savedFilters.viewMode || "month");
  const [selectedMonth, setSelectedMonth] = useState(
    savedFilters.selectedMonth || new Date().toISOString().slice(0, 7)
  );
  const [weekStart, setWeekStart] = useState(savedFilters.weekStart || "");
  const [weekEnd, setWeekEnd] = useState(savedFilters.weekEnd || "");

  const getValue = (notes, label) => {
    const line = notes
      ?.split("\n")
      .find((row) => row.toLowerCase().startsWith(label.toLowerCase()));

    return line ? line.split(":").slice(1).join(":").trim() : "";
  };

  useEffect(() => {
    sessionStorage.setItem(
      CBP_FILTER_STORAGE_KEY,
      JSON.stringify({
        viewMode,
        selectedMonth,
        weekStart,
        weekEnd
      })
    );
  }, [viewMode, selectedMonth, weekStart, weekEnd]);

  const fetchRecords = async () => {
    let url = "/tmc/callback-presentations";

    if (viewMode === "month") {
      url += `?month=${selectedMonth}`;
    }

    if (viewMode === "week") {
      url += `?weekStart=${weekStart}&weekEnd=${weekEnd}`;
    }

    if (viewMode === "all") {
      url += "?month=all";
    }

    const { data } = await api.get(url);
    setRecords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (viewMode === "week" && (!weekStart || !weekEnd)) {
      return;
    }

    fetchRecords();
  }, [viewMode, selectedMonth, weekStart, weekEnd]);

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) return;

    await api.delete(
      `/tmc/callback-presentations/${item.logId}/${item.callNumber}`
    );

    fetchRecords();
  };

  const handleGoToTmc = ({ businessName, mapLink, contactNumber }) => {
    sessionStorage.setItem(
      CBP_FILTER_STORAGE_KEY,
      JSON.stringify({
        viewMode,
        selectedMonth,
        weekStart,
        weekEnd
      })
    );

    navigate("/ba/tmc", {
      state: {
        callbackPresentation: {
          businessName,
          mapLink,
          contactNumber
        },
        returnTo: "/ba/data-sheet/callback-presentations"
      }
    });
  };

  const filteredRecords = useMemo(() => {
  if (!search.trim()) return records;

  const lower = search.toLowerCase();

  return records.filter((item) => {
    const businessName = getValue(item.notes, "Business Name");
    const mapLink = getValue(item.notes, "Map Link");
    const contactNumber = getValue(item.notes, "Contact Number");
    const manualNote = item.notes?.includes("Manual Note:")
      ? item.notes.split("Manual Note:").pop().trim()
      : "";

    return [
      item.date,
      item.callNumber,
      businessName,
      mapLink,
      contactNumber,
      manualNote
    ]
      .join(" ")
      .toLowerCase()
      .includes(lower);
  });
}, [records, search]);

const handleManualNoteChange = (item, value) => {
  setRecords((prev) =>
    prev.map((record) =>
      record._id === item._id
        ? { ...record, editedManualNote: value, isSaving: true }
        : record
    )
  );

  if (saveTimers[item._id]) {
    clearTimeout(saveTimers[item._id]);
  }

  const timer = setTimeout(async () => {
    try {
      await api.patch(
        `/tmc/callback-presentations/${item.logId}/${item.callNumber}/manual-note`,
        {
          manualNote: value
        }
      );

      setRecords((prev) =>
        prev.map((record) =>
          record._id === item._id
            ? { ...record, isSaving: false, isSaved: true }
            : record
        )
      );
    } catch (error) {
      console.error(error);
      setRecords((prev) =>
        prev.map((record) =>
          record._id === item._id
            ? { ...record, isSaving: false, saveError: true }
            : record
        )
      );
    }
  }, 800);

  setSaveTimers((prev) => ({
    ...prev,
    [item._id]: timer
  }));
};

const handleSaveManualNote = async (item) => {
  await api.patch(
    `/tmc/callback-presentations/${item.logId}/${item.callNumber}/manual-note`,
    {
      manualNote: item.editedManualNote ?? ""
    }
  );

  fetchRecords();
};

  return (
  <div className="cbp-page">
    <div className="cbp-card">
      <div className="cbp-header">
        <div>
          <h2 className="cbp-title">Call Back for Presentation</h2>
          <p className="cbp-subtitle">
            Manage callback presentation records, manual notes and follow-up actions
          </p>
        </div>
      </div>

      <div className="cbp-top-bar">
        <div className="cbp-filter-box cbp-view-box">
          <label>View</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="cbp-input"
          >
            <option value="month">Month Wise</option>
            <option value="week">Week Wise</option>
            <option value="all">All</option>
          </select>
        </div>

        {viewMode === "month" && (
          <div className="cbp-filter-box">
            <label>Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="cbp-input"
            />
          </div>
        )}

        {viewMode === "week" && (
          <>
            <div className="cbp-filter-box">
              <label>Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="cbp-input"
              />
            </div>

            <div className="cbp-filter-box">
              <label>Week End</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="cbp-input"
              />
            </div>
          </>
        )}

        <div className="cbp-filter-box cbp-search-box">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search business, contact number, map, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cbp-input"
          />
        </div>

        <div className="cbp-actions">
          <button className="btn btn-primary" onClick={fetchRecords}>
            Refresh
          </button>
        </div>
      </div>

      <div className="cbp-summary-card">
        <div>
          <h3>CBP Records</h3>
          <p>Call back for presentation records based on selected filter</p>
        </div>

        <span className="cbp-count-badge">{filteredRecords.length}</span>
      </div>

      <div className="cbp-table-wrapper">
        <table className="cbp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Call No</th>
              <th>Business Name</th>
              <th>Map Link</th>
              <th>Contact Number</th>
              <th>Manual Notes</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="cbp-empty-cell">
                  No records found
                </td>
              </tr>
            ) : (
              filteredRecords.map((item) => {
                const businessName = getValue(item.notes, "Business Name");
                const mapLink = getValue(item.notes, "Map Link");
                const contactNumber = getValue(item.notes, "Contact Number");

                const manualNote = item.notes?.includes("Manual Note:")
                  ? item.notes.split("Manual Note:").pop().trim()
                  : "";

                return (
                  <tr key={item._id}>
                    <td>{item.date || "-"}</td>
                    <td>{item.callNumber || "-"}</td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          handleGoToTmc({
                            businessName,
                            mapLink,
                            contactNumber
                          })
                        }
                        className="cbp-business-btn"
                      >
                        {businessName || "-"}
                      </button>
                    </td>

                    <td>
                      {mapLink ? (
                        <a href={mapLink} target="_blank" rel="noreferrer">
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{contactNumber || "-"}</td>

                    <td>
                      <textarea
                        value={item.editedManualNote ?? manualNote}
                        onChange={(e) =>
                          handleManualNoteChange(item, e.target.value)
                        }
                        rows="2"
                        className="cbp-note-input"
                        placeholder="Enter manual note"
                      />

                      <div className="cbp-save-status">
                        {item.isSaving && (
                          <span className="cbp-saving">Saving...</span>
                        )}

                        {item.isSaved && !item.isSaving && (
                          <span className="cbp-saved">Saved</span>
                        )}

                        {item.saveError && (
                          <span className="cbp-error">Save failed</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="cbp-footer-actions">
        <Link to="/ba/data-sheet" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
  </div>
);
};

export default CallbackPresentationsPage;