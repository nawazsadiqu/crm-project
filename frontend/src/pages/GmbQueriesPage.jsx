import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const GmbQueriesPage = () => {
  const today = new Date().toISOString().split("T")[0];

  const [records, setRecords] = useState([]);
  const [statusTab, setStatusTab] = useState("not done");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [baList, setBaList] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(
  new Date().toISOString().slice(0, 7)
);
const [monthMode, setMonthMode] = useState("month");

  const [formData, setFormData] = useState({
    date: today,
    businessName: "",
    baName: "",
    comment: "",
    mapLink: "",
    contactNumber: ""
  });

  const fetchBaList = async () => {
  try {
    const { data } = await api.get("/crm/gmb-queries/ba-list");
    setBaList(Array.isArray(data) ? data : []);
  } catch (error) {
    setBaList([]);
  }
};

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const monthQuery = monthMode === "all" ? "all" : selectedMonth;

const { data } = await api.get(
  `/crm/gmb-queries?status=${statusTab}&month=${monthQuery}`
);
      setRecords(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(error.response?.data?.message || "Failed to fetch GMB queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaList();
  fetchQueries();
}, [statusTab, selectedMonth, monthMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddQuery = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.businessName.trim()) {
      setMessage("Date and Business Name are required");
      return;
    }

    try {
      await api.post("/crm/gmb-queries", {
        date: formData.date,
        businessName: formData.businessName.trim(),
        baName: formData.baName.trim(),
        comment: formData.comment.trim(),
        mapLink: formData.mapLink.trim(),
        contactNumber: formData.contactNumber.trim()
      });

      setMessage("GMB query added successfully");

      setFormData({
        date: today,
        businessName: "",
        baName: "",
        comment: "",
        mapLink: "",
        contactNumber: ""
      });

      if (statusTab !== "not done") {
        setStatusTab("not done");
      } else {
        fetchQueries();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add GMB query");
    }
  };

  const handleMarkDone = async (id) => {
    try {
      await api.put(`/crm/gmb-queries/${id}/status`, {
        status: "done"
      });

      setRecords((prev) => prev.filter((item) => item._id !== id));
      setMessage("Query marked as done");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleMoveToNotDone = async (id) => {
    try {
      await api.put(`/crm/gmb-queries/${id}/status`, {
        status: "not done"
      });

      setRecords((prev) => prev.filter((item) => item._id !== id));
      setMessage("Query moved to Not Done");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this GMB query?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/crm/gmb-queries/${id}`);
      setRecords((prev) => prev.filter((item) => item._id !== id));
      setMessage("GMB query deleted successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete query");
    }
  };

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;

    const lower = search.toLowerCase();

    return records.filter((item) =>
      [
        item.date,
        item.businessName,
        item.baName,
        item.comment,
        item.contactNumber,
        item.mapLink
      ]
        .join(" ")
        .toLowerCase()
        .includes(lower)
    );
  }, [records, search]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>GMB Queries</h2>
      <p>Manually add and track GMB-related page issues.</p>

      {message && (
        <p
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: "#f1f5f9",
            fontWeight: "600"
          }}
        >
          {message}
        </p>
      )}

      <form
        onSubmit={handleAddQuery}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px"
        }}
      >
        <div>
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Business Name</label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Enter business name"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>BA Name</label>
          <select
  name="baName"
  value={formData.baName}
  onChange={handleChange}
  style={{ width: "100%", padding: "10px" }}
>
  <option value="">Select BA</option>
  {baList.map((ba) => (
    <option key={ba._id} value={ba.name}>
      {ba.employeeId} - {ba.name}
    </option>
  ))}
</select>
        </div>

        <div>
          <label>Contact Number</label>
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="Enter contact number"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Map Link</label>
          <input
            type="text"
            name="mapLink"
            value={formData.mapLink}
            onChange={handleChange}
            placeholder="Enter map link"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Comment</label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Enter query details"
            style={{
              width: "100%",
              padding: "10px",
              minHeight: "80px"
            }}
          />
        </div>

        <div>
          <button type="submit" className="btn btn-primary">
            Add Query
          </button>
        </div>
      </form>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px"
        }}
      >
        <button
          className={statusTab === "not done" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => setStatusTab("not done")}
        >
          Not Done Queries
        </button>

        <button
          className={statusTab === "done" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => setStatusTab("done")}
        >
          Done Queries
        </button>

        <input
          type="text"
          placeholder="Search queries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginLeft: "auto",
            width: "280px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      <div
  style={{
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px"
  }}
>
  <select
    value={monthMode}
    onChange={(e) => setMonthMode(e.target.value)}
    style={{
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc"
    }}
  >
    <option value="month">Month Wise</option>
    <option value="all">All Queries</option>
  </select>

  {monthMode === "month" && (
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
</div>

      {loading ? (
        <p>Loading GMB queries...</p>
      ) : filteredRecords.length === 0 ? (
        <p>No {statusTab} queries found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="appointments-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Business Name</th>
                <th>BA Name</th>
                <th>Comment</th>
                <th>Map Link</th>
                <th>Contact Number</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.date || "-"}</td>
                  <td>{item.businessName || "-"}</td>
                  <td>{item.baName || "-"}</td>
                  <td>{item.comment || "-"}</td>
                  <td>
                    {item.mapLink ? (
                      <a href={item.mapLink} target="_blank" rel="noreferrer">
                        Open Map
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{item.contactNumber || "-"}</td>
                  <td>{item.status === "done" ? "Done" : "Not Done"}</td>
                  <td>
  <div
    style={{
      display: "flex",
      gap: "8px",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "nowrap"
    }}
  >
    {statusTab === "not done" ? (
      <button
        className="btn btn-primary btn-sm"
        onClick={() => handleMarkDone(item._id)}
      >
        Done
      </button>
    ) : (
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => handleMoveToNotDone(item._id)}
      >
        Not done
      </button>
    )}

    <button
      className="btn btn-danger btn-sm"
      onClick={() => handleDelete(item._id)}
    >
      Delete
    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GmbQueriesPage;