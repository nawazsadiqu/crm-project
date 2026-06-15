import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const HrInterestedCandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCandidates = async () => {
    const { data } = await api.get("/hr-calling-data/interested-candidates");
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

  const handleInterviewDetailsChange = async (id, field, value) => {
  setCandidates((prev) =>
    prev.map((item) =>
      item._id === id
        ? {
            ...item,
            [field]: value,
          }
        : item
    )
  );

  const updatedCandidate = candidates.find((item) => item._id === id);

  await api.patch(`/hr-calling-data/${id}/interview-details`, {
  resumeGot:
    field === "resumeGot" ? value : updatedCandidate?.resumeGot || "",
  interview:
    field === "interview" ? value : updatedCandidate?.interview || false,
  interviewDate:
    field === "interviewDate"
      ? value
      : field === "interview" && value === false
      ? ""
      : updatedCandidate?.interviewDate || "",
});
};

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">Interested Candidates</h2>
            <p className="appointments-subtitle">
              Candidates marked as Interested
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
            <h3>Interested Records</h3>
            <p>Total interested candidates</p>
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
                <th>Resume Got</th>
                <th>Interview</th>
                <th>Interview Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No interested candidates found
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
                    <td>
                        <select
                        value={item.resumeGot || ""}
                        onChange={(e) =>
                        handleInterviewDetailsChange(item._id, "resumeGot", e.target.value)
                        }
                    >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        </select>
                    </td>

                    <td>
                        <input
                            type="checkbox"
                            checked={!!item.interview}
                            onChange={(e) =>
                            handleInterviewDetailsChange(
                            item._id,
                            "interview",
                            e.target.checked
                            )
                            }
                        />
                    </td>
                    <td>
                        {item.interview ? (
                        <input
                            type="date"
                            value={item.interviewDate || ""}
                            onChange={(e) =>
                            handleInterviewDetailsChange(
                            item._id,
                            "interviewDate",
                            e.target.value
                            )
                            }
                            style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            minWidth: "140px"
                            }}
                        />
                        ) : (
                        "-"
                        )}
                    </td>
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

export default HrInterestedCandidatesPage;