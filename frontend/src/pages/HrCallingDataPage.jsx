import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/callingData.css";

const HrCallingDataPage = () => {
  const navigate = useNavigate();

  const [csvFile, setCsvFile] = useState(null);
  const [callingData, setCallingData] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  const fetchCallingData = async () => {
    try {
      const { data } = await api.get(
        `/hr-calling-data?uploadBatch=${activeTab}`
      );
      setCallingData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch HR calling data", error);
      setCallingData([]);
    }
  };

  useEffect(() => {
    fetchCallingData();
  }, [activeTab]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      alert("Please select CSV file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("uploadBatch", activeTab);

      await api.post("/hr-calling-data/upload", formData);

      alert(`CSV uploaded successfully in Upload ${activeTab}`);
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

  const handleCandidateClick = (item) => {
    navigate(`/hr/tmc?callingDataId=${item._id}`);
  };

  return (
    <div className="calling-data-page">
      <div className="calling-data-header">
        <h2>HR Calling Data</h2>
        <p>Upload, manage, and track HR calling data</p>
      </div>

      <div className="calling-tabs">
        {[1, 2, 3, 4].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active-tab" : ""}
            onClick={() => setActiveTab(tab)}
          >
            Data {tab}
          </button>
        ))}
      </div>

      <form className="calling-upload-box" onSubmit={handleUpload}>
        <h3>Upload CSV - Data {activeTab}</h3>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files[0])}
        />

        <button type="submit">Upload CSV</button>
      </form>

      <div className="calling-data-table-box">
        <h3>Calling Data {activeTab} </h3>

        {callingData.length === 0 ? (
          <p>No calling data uploaded in Upload {activeTab}.</p>
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
                <th>Response 1</th>
                <th>Response 2</th>
                <th>Response 3</th>
                <th>Response 4</th>
                <th>Last Response</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {callingData.map((item, index) => (
                <tr key={item._id}>
                  <td>{item.serialNumber || index + 1}</td>

                  <td>
                    <button
                      type="button"
                      className="candidate-link-btn"
                      onClick={() => handleCandidateClick(item)}
                    >
                      {item.candidateName || "-"}
                    </button>
                  </td>

                  <td>{item.contactNumber || "-"}</td>
                  <td>{item.qualification || "-"}</td>
                  <td>{item.location || "-"}</td>
                  <td>{item.experience || "-"}</td>

                  <td>{item.response1 || "-"}</td>
                  <td>{item.response2 || "-"}</td>
                  <td>{item.response3 || "-"}</td>
                  <td>{item.response4 || "-"}</td>
                  <td>{item.response5 || item.lastResponse || "-"}</td>

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