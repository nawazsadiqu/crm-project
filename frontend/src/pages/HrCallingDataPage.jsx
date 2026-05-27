import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/callingData.css";

const HrCallingDataPage = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [callingData, setCallingData] = useState([]);

  const fetchCallingData = async () => {
    try {
      const { data } = await api.get("/hr-calling-data");
      setCallingData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch HR calling data", error);
      setCallingData([]);
    }
  };

  useEffect(() => {
    fetchCallingData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      alert("Please select CSV file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      await api.post("/hr-calling-data/upload", formData);

      alert("CSV uploaded successfully");
      setCsvFile(null);
      e.target.reset();
      fetchCallingData();
    } catch (error) {
      console.error(error);
      alert("Failed to upload CSV");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this calling data?")) return;

    try {
      await api.delete(`/hr-calling-data/${id}`);
      fetchCallingData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete data");
    }
  };

  return (
    <div className="calling-data-page">
      <div className="calling-data-header">
        <h2>HR Calling Data</h2>
        <p>Upload, manage, and track HR calling data</p>
      </div>

      <form className="calling-upload-box" onSubmit={handleUpload}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files[0])}
        />

        <button type="submit">Upload CSV</button>
      </form>

      <div className="calling-data-table-box">
        <h3>Uploaded Calling Data</h3>

        {callingData.length === 0 ? (
          <p>No calling data uploaded yet.</p>
        ) : (
          <table className="calling-data-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Candidate Name</th>
                <th>Contact</th>
                <th>Qualification</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Last Response</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {callingData.map((item, index) => (
                <tr key={item._id}>
                  <td>{item.serialNumber || index + 1}</td>
                  <td>{item.candidateName || "-"}</td>
                  <td>{item.contactNumber || "-"}</td>
                  <td>{item.qualification || "-"}</td>
                  <td>{item.location || "-"}</td>
                  <td>{item.experience || "-"}</td>
                  <td>{item.lastResponse || "-"}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HrCallingDataPage;