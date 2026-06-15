import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const HrCallbackCandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCandidates = async () => {
    const { data } = await api.get("/hr-calling-data/callback-candidates");
    setCandidates(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter((item) => {
    const search = searchTerm.toLowerCase();

    return [
      item.candidateName,
      item.contactNumber,
      item.qualification,
      item.location,
      item.experience,
      item.lastResponse,
      item.notes
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">Call Back Candidates</h2>
            <p className="appointments-subtitle">
              Candidates marked as Call Back, Not Lifting, or Not Connected
            </p>
          </div>
        </div>

        <div className="appointments-top-bar">
          <div className="appointments-filter-card appointments-search-card">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search name, number, location, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="appointments-actions">
            <button className="btn btn-primary" onClick={fetchCandidates}>
              Refresh
            </button>
          </div>
        </div>

        <div className="appointments-summary-card">
          <div>
            <h3>Call Back Records</h3>
            <p>Total follow-up candidates</p>
          </div>
          <span className="appointments-count-badge">
            {filteredCandidates.length}
          </span>
        </div>

        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Contact</th>
                <th>Qualification</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Last Response</th>
                <th>Response Date</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No call back candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((item) => (
                  <tr key={item._id}>
                    <td>{item.candidateName || "-"}</td>
                    <td>{item.contactNumber || "-"}</td>
                    <td>{item.qualification || "-"}</td>
                    <td>{item.location || "-"}</td>
                    <td>{item.experience || "-"}</td>
                    <td>{item.lastResponse || "-"}</td>
                    <td>{item.lastResponseDate || "-"}</td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="appointments-bottom-actions">
          <Link to="/hr/data-sheet" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HrCallbackCandidatesPage;