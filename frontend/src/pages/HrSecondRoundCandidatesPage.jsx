import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const HrSecondRoundCandidatesPage = () => {
  const [candidates, setCandidates] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedCandidate,
    setSelectedCandidate
  ] = useState(null);

  const [
    joinedDate,
    setJoinedDate
  ] = useState("");

  const [
    showJoinedDatePopup,
    setShowJoinedDatePopup
  ] = useState(false);

  const [
    updatingCandidateId,
    setUpdatingCandidateId
  ] = useState("");

  const fetchCandidates = async () => {
    try {
      const { data } = await api.get(
        "/hr-calling-data/second-round-candidates"
      );

      setCandidates(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch second round candidates",
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

  const handleJoinedCheckbox = (
    item,
    checked
  ) => {
    if (!checked) {
      return;
    }

    setSelectedCandidate(item);

    setJoinedDate(
      getTodayDate()
    );

    setShowJoinedDatePopup(true);
  };

  const handleCloseJoinedPopup =
    () => {
      setShowJoinedDatePopup(false);
      setSelectedCandidate(null);
      setJoinedDate("");
    };

  const handleConfirmJoined =
    async () => {
      if (!selectedCandidate) {
        return;
      }

      if (!joinedDate) {
        alert(
          "Please select joined date"
        );

        return;
      }

      try {
        setUpdatingCandidateId(
          selectedCandidate._id
        );

        await api.patch(
          `/hr-calling-data/${selectedCandidate._id}/interview-stage`,
          {
            joined: true,
            joinedDate,
          }
        );

        handleCloseJoinedPopup();

        /*
         * Candidate is now joined,
         * so backend removes them
         * from Second Round Candidates.
         */
        await fetchCandidates();
      } catch (error) {
        console.error(
          "Failed to mark candidate as joined",
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
              Second Round Candidates
            </h2>

            <p className="appointments-subtitle">
              Candidates who attended the
              second round of interview
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
              Second Round Records
            </h3>

            <p>
              Candidates who attended the
              second round
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
                  Joined
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No second round
                    candidates found
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
                            checked={Boolean(item.joined)}
                            disabled={
                                Boolean(item.joined) ||
                                updatingCandidateId === item._id
                            }
                            onChange={(e) =>
                            handleJoinedCheckbox(
                                item,
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

      {showJoinedDatePopup &&
        selectedCandidate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={
              handleCloseJoinedPopup
            }
          >
            <div
              style={{
                width: "360px",
                maxWidth: "90%",
                background: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.2)",
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Confirm Joining
              </h3>

              <p>
                {selectedCandidate.candidateName ||
                  "Candidate"}
              </p>

              <div
                style={{
                  marginTop: "18px",
                  marginBottom: "20px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Joined Date
                </label>

                <input
                  type="date"
                  value={joinedDate}
                  onChange={(e) =>
                    setJoinedDate(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border:
                      "1px solid #ccc",
                    borderRadius:
                      "6px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    handleCloseJoinedPopup
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    handleConfirmJoined
                  }
                >
                  Confirm Joined
                </button>
              </div>

            </div>
          </div>
        )}

    </div>
  );
};

export default HrSecondRoundCandidatesPage;