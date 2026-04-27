import { useEffect, useState } from "react";
import Papa from "papaparse";
import api from "../services/api";
import "../css/adminCallingData.css";

const AdminCallingDataPage = () => {
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");

      const usersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : Array.isArray(data.data)
        ? data.data
        : [];

      setUsers(usersArray);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map((row) => ({
          businessName:
            row["Business Name"] ||
            row["businessName"] ||
            row["Business"] ||
            "",
          mapLink:
            row["Map Link"] ||
            row["Google Map Link"] ||
            row["mapLink"] ||
            "",
          contactNumber:
            row["Contact Number"] ||
            row["Phone"] ||
            row["Mobile"] ||
            row["Mob No"] ||
            row["contactNumber"] ||
            ""
        }));

        const validRows = parsedData.filter((item) =>
          item.businessName.trim()
        );

        setPreviewData(validRows);
        setMessage(`${validRows.length} records loaded from CSV`);
      },
      error: () => {
        setMessage("Failed to read CSV file");
      }
    });
  };

  const handleUpload = async () => {
    try {
      if (!assignedTo) {
        setMessage("Please select a BA");
        return;
      }

      if (previewData.length === 0) {
        setMessage("Please upload a CSV file before saving");
        return;
      }

      const { data } = await api.post("/calling-data/bulk", {
        assignedTo,
        data: previewData
      });

      setMessage(data.message || "Calling data uploaded successfully");
      setPreviewData([]);
      setAssignedTo("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to upload calling data");
    }
  };

  const baUsers = users.filter(
    (user) => String(user.role || "").toLowerCase().trim() === "ba"
  );

  return (
    <div className="admin-calling-page">
      <div className="admin-calling-card">
        <div className="admin-calling-header">
          <div>
            <h2>Calling Data Upload</h2>
            <p>Assign CSV calling data to a specific BA</p>
          </div>
        </div>

        {message && <p className="admin-calling-message">{message}</p>}

        <div className="admin-calling-form">
          <div className="admin-calling-field">
            <label>Select BA</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Select BA</option>
              {baUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name || "No Name"} - {user.email || "No Email"}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-calling-field">
            <label>Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
            />
          </div>

          <div className="admin-calling-actions">
            <button className="btn btn-primary" onClick={handleUpload}>
              Upload Data
            </button>
          </div>
        </div>

        {previewData.length > 0 && (
          <div className="admin-calling-preview">
            <h3>Preview ({previewData.length})</h3>

            <div className="admin-calling-table-wrap">
              <table className="admin-calling-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Map Link</th>
                    <th>Contact Number</th>
                  </tr>
                </thead>

                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.businessName}</td>
                      <td>{item.mapLink || "-"}</td>
                      <td>{item.contactNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCallingDataPage;