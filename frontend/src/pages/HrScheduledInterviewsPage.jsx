import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const HrScheduledInterviewsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingCandidateId, setUpdatingCandidateId] =
    useState("");

  const fetchCandidates = async () => {
    try {
      const { data } = await api.get(
        "/hr-calling-data/scheduled-interviews"
      );

      setCandidates(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch scheduled interviews",
        error
      );

      setCandidates([]);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates =
    candidates.filter((item) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      return [
        item.interviewDate,
        item.candidateName,
        item.contactNumber,
        item.jobPortal,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  const handleFirstRoundAttendedChange =
    async (id, checked) => {
      try {
        setUpdatingCandidateId(id);

        await api.patch(
          `/hr-calling-data/${id}/interview-stage`,
          {
            firstRoundAttended: checked,
          }
        );

        await fetchCandidates();
      } catch (error) {
        console.error(
          "Failed to update first round attendance",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to update candidate"
        );
      } finally {
        setUpdatingCandidateId("");
      }
    };

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">
              Scheduled Interviews
            </h2>

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
              placeholder="Search date, name, number, portal..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

          <div className="appointments-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={fetchCandidates}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="appointments-summary-card">
          <div>
            <h3>
              Scheduled Interview Records
            </h3>

            <p>
              Total candidates scheduled for interview
            </p>
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
                <th>Job Portal</th>
                <th>Attended First Round</th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                    }}
                  >
                    No scheduled interviews found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {item.interviewDate || "-"}
                    </td>

                    <td>
                      {item.candidateName || "-"}
                    </td>

                    <td>
                      {item.contactNumber || "-"}
                    </td>

                    <td>
                      {item.jobPortal || "-"}
                    </td>

                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(
                          item.firstRoundAttended
                        )}
                        disabled={
                          updatingCandidateId === item._id
                        }
                        onChange={(e) =>
                          handleFirstRoundAttendedChange(
                            item._id,
                            e.target.checked
                          )
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="appointments-bottom-actions">
          <Link
            to="/hr/data-sheet"
            className="btn btn-secondary"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HrScheduledInterviewsPage;