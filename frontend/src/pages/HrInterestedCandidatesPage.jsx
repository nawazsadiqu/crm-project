import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const getCurrentMonthValue = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
};

const HrInterestedCandidatesPage = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonthValue()
  );

  const [
    showWhatsAppPopup,
    setShowWhatsAppPopup,
  ] = useState(false);

  const [
    selectedWhatsAppCandidate,
    setSelectedWhatsAppCandidate,
  ] = useState(null);

  /*
   * Fetch interested candidates
   * for selected month
   */
  const fetchCandidates = async () => {
    try {
      const { data } = await api.get(
        "/hr-calling-data/interested-candidates",
        {
          params: {
            month: selectedMonth,
          },
        }
      );

      setCandidates(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch interested candidates",
        error
      );

      setCandidates([]);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedMonth]);

  /*
   * Search
   */
  const filteredCandidates =
    candidates.filter((item) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      return [
        item.candidateName,
        item.contactNumber,
        item.jobPortal,
        item.location,
        item.qualification,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  /*
   * Resume Got
   *
   * Interview and interviewDate are
   * intentionally preserved here.
   *
   * Interview scheduling will now
   * happen only from Resume Got page.
   */
  const handleResumeGotChange = async (
    id,
    value
  ) => {
    const candidate =
      candidates.find(
        (item) => item._id === id
      );

    if (!candidate) {
      return;
    }

    /*
     * Optimistic UI update
     */
    setCandidates((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              resumeGot: value,
            }
          : item
      )
    );

    try {
      await api.patch(
        `/hr-calling-data/${id}/interview-details`,
        {
          resumeGot: value,

          /*
           * Preserve existing interview
           * information if this candidate
           * was already scheduled earlier.
           */
          interview:
            Boolean(
              candidate.interview
            ),

          interviewDate:
            candidate.interviewDate ||
            "",
        }
      );
    } catch (error) {
      console.error(
        "Failed to update resume status",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Failed to update candidate"
      );

      /*
       * Restore server version
       * if update fails.
       */
      fetchCandidates();
    }
  };

  /*
   * Delete candidate
   */
  const handleDeleteCandidate =
    async (id) => {
      const confirmed =
        window.confirm(
          "Remove this candidate from Interested Candidates?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(
          `/hr-calling-data/candidate-pipeline/${id}`
        );

        setCandidates(
          (previousCandidates) =>
            previousCandidates.filter(
              (candidate) =>
                candidate._id !== id
            )
        );
      } catch (error) {
        console.error(
          "Failed to delete interested candidate",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Failed to delete candidate"
        );
      }
    };

  /*
   * Open original candidate
   * inside HR TMC
   */
  const handleCandidateClick = (
    item
  ) => {
    if (
      !item.sourceCallingDataId
    ) {
      alert(
        "Original calling-data record was not found"
      );

      return;
    }

    navigate(
      `/hr/tmc?callingDataId=${item.sourceCallingDataId}&returnPage=interested-candidates`
    );
  };

  /*
   * WhatsApp helpers
   */
  const normalizeWhatsAppNumber = (
    number
  ) => {
    let cleanNumber = String(
      number || ""
    ).replace(/\D/g, "");

    if (
      cleanNumber.length === 11 &&
      cleanNumber.startsWith("0")
    ) {
      cleanNumber =
        cleanNumber.slice(1);
    }

    if (
      cleanNumber.length === 10
    ) {
      cleanNumber =
        `91${cleanNumber}`;
    }

    if (
      cleanNumber.length < 10 ||
      cleanNumber.length > 15
    ) {
      return "";
    }

    return cleanNumber;
  };

  const getHrWhatsAppMessage = (
    candidate
  ) => {
    const candidateName =
      candidate?.candidateName ||
      "Candidate";

    return `Hi ${candidateName},

Greetings from Conquest Techno Solutions.

We are pleased to inform you that your resume has been shortlisted and you have been selected for the interview round.

The interview date, time, and further details will be sent to you shortly.

Regards,
Kavya Kadam (HR Executive)
Conquest Techno Solutions`;
  };

  const handleWhatsAppButtonClick = (
    event,
    item
  ) => {
    event.stopPropagation();

    const normalizedNumber =
      normalizeWhatsAppNumber(
        item.contactNumber
      );

    if (!normalizedNumber) {
      alert(
        "Valid contact number is required to send WhatsApp message"
      );

      return;
    }

    setSelectedWhatsAppCandidate(
      item
    );

    setShowWhatsAppPopup(
      true
    );
  };

  const handleCloseWhatsAppPopup =
    () => {
      setShowWhatsAppPopup(false);

      setSelectedWhatsAppCandidate(
        null
      );
    };

  const handleOpenWhatsApp = () => {
    if (
      !selectedWhatsAppCandidate
    ) {
      return;
    }

    const normalizedNumber =
      normalizeWhatsAppNumber(
        selectedWhatsAppCandidate
          .contactNumber
      );

    if (!normalizedNumber) {
      alert(
        "Valid contact number is required"
      );

      return;
    }

    const message =
      getHrWhatsAppMessage(
        selectedWhatsAppCandidate
      );

    const whatsAppUrl =
      `https://wa.me/${normalizedNumber}` +
      `?text=${encodeURIComponent(
        message
      )}`;

    const openedWindow =
      window.open(
        whatsAppUrl,
        "_blank"
      );

    if (!openedWindow) {
      alert(
        "WhatsApp could not open. Please allow browser popups."
      );

      return;
    }

    openedWindow.opener =
      null;

    handleCloseWhatsAppPopup();
  };

  return (
    <div className="appointments-page">
      <div className="appointments-card">

        {/* Header */}

        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">
              Interested Candidates
            </h2>

            <p className="appointments-subtitle">
              Candidates marked as
              Interested
            </p>
          </div>
        </div>

        {/* Filters */}

        <div className="appointments-top-bar">

          <div className="appointments-filter-card">
            <label>
              Month
            </label>

            <input
              type="month"
              value={
                selectedMonth
              }
              onChange={(e) => {
                setSelectedMonth(
                  e.target.value
                );

                setSearchTerm("");
              }}
            />
          </div>

          <div className="appointments-filter-card appointments-search-card">
            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Search name, number, portal, location, qualification..."
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
              onClick={
                fetchCandidates
              }
            >
              Refresh
            </button>
          </div>

        </div>

        {/* Summary */}

        <div className="appointments-summary-card">
          <div>
            <h3>
              Interested Records
            </h3>

            <p>
              Total interested
              candidates
            </p>
          </div>

          <span className="appointments-count-badge">
            {
              filteredCandidates.length
            }
          </span>
        </div>

        {/* Table */}

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
                  Location
                </th>

                <th>
                  Qualification
                </th>

                <th>
                  WhatsApp
                </th>

                <th>
                  Resume Got
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No interested
                    candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(
                  (item) => (
                    <tr
                      key={
                        item._id
                      }
                    >

                      {/* Candidate Name */}

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            handleCandidateClick(
                              item
                            )
                          }
                          title="Open candidate in HR TMC"
                          style={{
                            padding: 0,
                            border:
                              "none",
                            background:
                              "transparent",
                            color:
                              "inherit",
                            fontWeight:
                              "inherit",
                            cursor:
                              "pointer",
                            textDecoration:
                              "none",
                          }}
                        >
                          {item.candidateName ||
                            "-"}
                        </button>
                      </td>

                      {/* Contact */}

                      <td>
                        {item.contactNumber ||
                          "-"}
                      </td>

                      {/* Job Portal */}

                      <td>
                        {item.jobPortal ||
                          "-"}
                      </td>

                      {/* Location */}

                      <td>
                        {item.location ||
                          "-"}
                      </td>

                      {/* Qualification */}

                      <td>
                        {item.qualification ||
                          "-"}
                      </td>

                      {/* WhatsApp */}

                      <td className="interested-whatsapp-cell">
                        {item.contactNumber ? (
                          <button
                            type="button"
                            className="interested-whatsapp-btn"
                            onClick={(
                              event
                            ) =>
                              handleWhatsAppButtonClick(
                                event,
                                item
                              )
                            }
                          >
                            WhatsApp
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Resume Got */}

                      <td>
                        <select
                          value={
                            item.resumeGot ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            handleResumeGotChange(
                              item._id,
                              e.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            Select
                          </option>

                          <option value="Yes">
                            Yes
                          </option>

                          <option value="No">
                            No
                          </option>
                        </select>
                      </td>

                      {/* Action */}

                      <td>
                        <button
                          type="button"
                          className="interested-delete-btn"
                          onClick={() =>
                            handleDeleteCandidate(
                              item._id
                            )
                          }
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  )
                )
              )}
            </tbody>

          </table>
        </div>

        {/* Back */}

        <div className="appointments-bottom-actions">
          <Link
            to="/hr/data-sheet"
            className="btn btn-secondary"
          >
            Back
          </Link>
        </div>

      </div>

      {/* WhatsApp Popup */}

      {showWhatsAppPopup &&
        selectedWhatsAppCandidate && (
          <div
            className="interested-whatsapp-popup-overlay"
            onClick={
              handleCloseWhatsAppPopup
            }
          >
            <div
              className="interested-whatsapp-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="interested-whatsapp-popup-icon">
                WA
              </div>

              <h2>
                Send WhatsApp Message
              </h2>

              <p className="interested-whatsapp-popup-subtitle">
                Review the candidate
                details and message before
                opening WhatsApp.
              </p>

              <div className="interested-whatsapp-candidate-details">

                <div>
                  <span>
                    Candidate Name
                  </span>

                  <strong>
                    {selectedWhatsAppCandidate
                      .candidateName ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Contact Number
                  </span>

                  <strong>
                    {selectedWhatsAppCandidate
                      .contactNumber ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Job Portal
                  </span>

                  <strong>
                    {selectedWhatsAppCandidate
                      .jobPortal ||
                      "-"}
                  </strong>
                </div>

              </div>

              <div className="interested-whatsapp-message-preview">
                <span>
                  Message Preview
                </span>

                <p>
                  {getHrWhatsAppMessage(
                    selectedWhatsAppCandidate
                  )}
                </p>
              </div>

              <div className="interested-whatsapp-popup-actions">

                <button
                  type="button"
                  className="interested-whatsapp-close-btn"
                  onClick={
                    handleCloseWhatsAppPopup
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="interested-whatsapp-open-btn"
                  onClick={
                    handleOpenWhatsApp
                  }
                >
                  Open WhatsApp
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
};

export default HrInterestedCandidatesPage;