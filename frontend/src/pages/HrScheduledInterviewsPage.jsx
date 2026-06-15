import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const HrScheduledInterviewsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCandidates = async () => {
    const { data } = await api.get("/hr-calling-data/scheduled-interviews");
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
      item.lastResponseDate,
      item.interviewDate,
      item.notes
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  const handleNotesChange = async (id, value) => {
  setCandidates((prev) =>
    prev.map((item) =>
      item._id === id ? { ...item, notes: value } : item
    )
  );

  try {
    await api.patch(`/hr-calling-data/${id}/notes`, {
      notes: value,
    });
  } catch (error) {
    console.error("Failed to update notes", error);
  }
};

const handleJoinedChange = async (id, checked) => {
  setCandidates((prev) =>
    prev.map((item) =>
      item._id === id
        ? {
            ...item,
            joined: checked,
          }
        : item
    )
  );

  const candidate = candidates.find((item) => item._id === id);

  try {
    await api.patch(`/hr-calling-data/${id}/interview-details`, {
      resumeGot: candidate?.resumeGot || "",
      interview: candidate?.interview || false,
      interviewDate: candidate?.interviewDate || "",
      joined: checked,
    });
  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">Scheduled Interviews</h2>
            <p className="appointments-subtitle">
              Candidates with scheduled interview dates
            </p>
          </div>
        </div>

        <div className="appointments-top-bar">
          <div className="appointments-filter-card appointments-search-card">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search name, number, date, location..."
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
            <h3>Scheduled Interview Records</h3>
            <p>Total candidates scheduled for interview</p>
          </div>
          <span className="appointments-count-badge">
            {filteredCandidates.length}
          </span>
        </div>

        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Interview Date</th>
                <th>Candidate Name</th>
                <th>Contact</th>
                <th>Qualification</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Resume Got</th>
                <th>Joined</th>
                <th>Last Response</th>
                <th>Response Date</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No scheduled interviews found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((item) => (
                  <tr key={item._id}>
                    <td>{item.interviewDate || "-"}</td>
                    <td>{item.candidateName || "-"}</td>
                    <td>{item.contactNumber || "-"}</td>
                    <td>{item.qualification || "-"}</td>
                    <td>{item.location || "-"}</td>
                    <td>{item.experience || "-"}</td>
                    <td>{item.resumeGot || "-"}</td>
                    <td>
                        <input
                            type="checkbox"
                            checked={!!item.joined}
                            onChange={(e) =>
                            handleJoinedChange(item._id, e.target.checked)
                            }
                        />
                    </td>
                    <td>{item.lastResponse || "-"}</td>
                    <td>{item.lastResponseDate || "-"}</td>
                    <td>
                        <textarea
                            value={item.notes || ""}
                            onChange={(e) => handleNotesChange(item._id, e.target.value)}
                            className="appointment-notes-input"
                            placeholder="Add notes"
                        />
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

export default HrScheduledInterviewsPage;