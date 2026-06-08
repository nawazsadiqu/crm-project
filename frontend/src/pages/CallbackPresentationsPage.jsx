import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const CallbackPresentationsPage = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);

  const [viewMode, setViewMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  const getValue = (notes, label) => {
    const line = notes
      ?.split("\n")
      .find((row) => row.toLowerCase().startsWith(label.toLowerCase()));

    return line ? line.split(":").slice(1).join(":").trim() : "";
  };

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

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <h2>Call Back for Presentation</h2>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap"
          }}
        >
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          >
            <option value="month">Month Wise</option>
            <option value="week">Week Wise</option>
            <option value="all">All</option>
          </select>

          {viewMode === "month" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />
          )}

          {viewMode === "week" && (
            <>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc"
                }}
              />

              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc"
                }}
              />
            </>
          )}

          <button className="btn btn-primary" onClick={fetchRecords}>
            Refresh
          </button>
        </div>

        <table className="appointments-table">
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
            {records.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            ) : (
              records.map((item) => {
                const businessName = getValue(item.notes, "Business Name");
                const mapLink = getValue(item.notes, "Map Link");
                const contactNumber = getValue(
                  item.notes,
                  "Contact Number"
                );
                const manualNote = item.notes?.includes("Manual Note:")
                  ? item.notes.split("Manual Note:").pop().trim()
                  : "";

                return (
                  <tr key={item._id}>
                    <td>{item.date}</td>
                    <td>{item.callNumber}</td>

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
                        style={{
                          background: "none",
                          border: "none",
                          color: "#000000",
                          cursor: "pointer",
                          fontWeight: "700",
                          textDecoration: "none"
                        }}
                      >
                        {businessName || "-"}
                      </button>
                    </td>

                    <td>
                      {mapLink ? (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{contactNumber || "-"}</td>
                    <td>{manualNote || "-"}</td>

                    <td>
                      <button
                        className="btn btn-danger"
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

        <Link to="/ba/data-sheet" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
  );
};

export default CallbackPresentationsPage;