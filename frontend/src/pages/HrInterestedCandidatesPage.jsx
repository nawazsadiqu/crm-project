import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const CandidateResponse = ({ response, date }) => {
  if (!response) {
    return "-";
  }

  return (
    <div className="candidate-response-cell">
      <strong>{response}</strong>

      {date && (
        <span className="candidate-response-date">
          {date}
        </span>
      )}
    </div>
  );
};

const HrInterestedCandidatesPage = () => {
  const navigate = useNavigate();
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
  item.jobPortal,
  item.qualification,
  item.location,
  item.experience,

  item.response1,
  item.response1Date,
  item.response2,
  item.response2Date,
  item.response3,
  item.response3Date,
  item.response4,
  item.response4Date,
  item.response5,
  item.response5Date,

  item.lastResponse,
  item.lastResponseDate,
  item.notes,
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

const handleDeleteCandidate = async (id) => {
  const confirmed = window.confirm(
    "Remove this candidate from Interested Candidates?"
  );

  if (!confirmed) return;

  try {
    await api.delete(
      `/hr-calling-data/candidate-pipeline/${id}`
    );

    setCandidates((previousCandidates) =>
      previousCandidates.filter(
        (candidate) => candidate._id !== id
      )
    );
  } catch (error) {
    console.error(
      "Failed to delete interested candidate",
      error
    );

    alert(
      error.response?.data?.message ||
        "Failed to delete candidate"
    );
  }
};

const handleCandidateClick = (item) => {
  if (!item.sourceCallingDataId) {
    alert("Original calling-data record was not found");
    return;
  }

  navigate(
    `/hr/tmc?callingDataId=${item.sourceCallingDataId}&returnPage=interested-candidates`
  );
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
                <th>Response 1</th>
                <th>Response 2</th>
                <th>Response 3</th>
                <th>Response 4</th>
                <th>Response 5</th>
                <th>Notes</th>
                <th>Resume Got</th>
                <th>Interview</th>
                <th>Interview Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="16" style={{ textAlign: "center" }}>
                    No interested candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((item) => (
  <tr key={item._id}>
    <td>
  <button
    type="button"
    onClick={() => handleCandidateClick(item)}
    title="Open candidate in HR TMC"
    style={{
      padding: 0,
      border: "none",
      background: "transparent",
      color: "#2563eb",
      fontWeight: 700,
      cursor: "pointer",
      textDecoration: "underline",
    }}
  >
    {item.candidateName || "-"}
  </button>
</td>

    <td>{item.contactNumber || "-"}</td>

    <td>{item.qualification || "-"}</td>

    <td>{item.location || "-"}</td>

    <td>{item.experience || "-"}</td>

    <td>
      <CandidateResponse
        response={item.response1}
        date={item.response1Date}
      />
    </td>

    <td>
      <CandidateResponse
        response={item.response2}
        date={item.response2Date}
      />
    </td>

    <td>
      <CandidateResponse
        response={item.response3}
        date={item.response3Date}
      />
    </td>

    <td>
      <CandidateResponse
        response={item.response4}
        date={item.response4Date}
      />
    </td>

    <td>
      <CandidateResponse
        response={item.response5}
        date={item.response5Date}
      />
    </td>

    <td>{item.notes || "-"}</td>

    <td>
      <select
        value={item.resumeGot || ""}
        onChange={(e) =>
          handleInterviewDetailsChange(
            item._id,
            "resumeGot",
            e.target.value
          )
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
        checked={Boolean(item.interview)}
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
            minWidth: "140px",
          }}
        />
      ) : (
        "-"
      )}
    </td>

    <td>
      <button
        type="button"
        className="interested-delete-btn"
        onClick={() =>
          handleDeleteCandidate(item._id)
        }
      >
        Delete
      </button>
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