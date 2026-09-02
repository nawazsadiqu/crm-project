import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const HrFirstRoundCandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [
    updatingCandidateId,
    setUpdatingCandidateId
  ] = useState("");

  const fetchCandidates = async () => {
    try {
      const { data } = await api.get(
        "/hr-calling-data/first-round-candidates"
      );

      setCandidates(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch first round candidates",
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
        item.candidateName,
        item.contactNumber,
        item.jobPortal,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  const handleSecondRoundChange = async (
    id,
    checked
  ) => {
    try {
      setUpdatingCandidateId(id);

      await api.patch(
        `/hr-calling-data/${id}/interview-stage`,
        {
          secondRoundSelected: checked,
        }
      );

      /*
       * Once checked, this candidate
       * moves from First Round Candidates
       * to Second Round Candidates.
       */
      await fetchCandidates();
    } catch (error) {
      console.error(
        "Failed to move candidate to second round",
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
              First Round Candidates
            </h2>

            <p className="appointments-subtitle">
              Candidates who attended the first round
              of interview
            </p>
          </div>
        </div>

        <div className="appointments-top-bar">

          <div className="appointments-filter-card appointments-search-card">
            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Search name, number, portal..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
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
              First Round Records
            </h3>

            <p>
              Candidates who attended the first round
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
                <th>
                  Candidate Name
                </th>

                <th>
                  Contact
                </th>

                <th>
                  Job Portal
                </th>

                <th>
                  Attended Second Round
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                    }}
                  >
                    No first round candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(
                  (item) => (
                    <tr key={item._id}>

                      <td>
                        {item.candidateName ||
                          "-"}
                      </td>

                      <td>
                        {item.contactNumber ||
                          "-"}
                      </td>

                      <td>
                        {item.jobPortal ||
                          "-"}
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            item.secondRoundSelected
                          )}
                          disabled={
                            updatingCandidateId ===
                            item._id
                          }
                          onChange={(e) =>
                            handleSecondRoundChange(
                              item._id,
                              e.target.checked
                            )
                          }
                        />
                      </td>

                    </tr>
                  )
                )
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

export default HrFirstRoundCandidatesPage;