import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import api from "../services/api";
import "../css/callingData.css";


const getLastResponseRowClass = (
  response
) => {
  if (!response) return "";

  const normalizedResponse =
    String(response)
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  if (
    normalizedResponse ===
    "INTERESTED"
  ) {
    return "hr-row-interested";
  }

  if (
    normalizedResponse ===
      "NOT_INTERESTED" ||
    normalizedResponse ===
      "NOT_SELECTED"
  ) {
    return "hr-row-rejected";
  }

  if (
    normalizedResponse ===
      "CALLBACK" ||
    normalizedResponse ===
      "CALL_BACK" ||
    normalizedResponse ===
      "NOT_LIFTING" ||
    normalizedResponse ===
      "NOT_CONNECTED" ||
    normalizedResponse ===
      "NOT_CONNECTING"
  ) {
    return "hr-row-followup";
  }

  return "";
};


const HrCallingDataPage = () => {
  const navigate =
    useNavigate();

  const [searchParams] = useSearchParams();

  const returnedTab = Number(searchParams.get("tab")) || 1;

  const [csvFile,setCsvFile] = useState(null);

  const [callingData,setCallingData] = useState([]);

  const [activeTab,setActiveTab] = useState(returnedTab);

  const [jobPortalSearch, setJobPortalSearch] = useState("");
  const [portalSortOrder, setPortalSortOrder] = useState("asc");

  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [selectedWhatsAppCandidate, setSelectedWhatsAppCandidate] = useState(null);


  const fetchCallingData =
    async () => {
      try {
        const { data } =
          await api.get(
            `/hr-calling-data?uploadBatch=${activeTab}`
          );

        setCallingData(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to fetch HR calling data",
          error
        );

        setCallingData([]);
      }
    };


  useEffect(() => {
    fetchCallingData();
  }, [activeTab]);


  const handleUpload =
    async (e) => {
      e.preventDefault();

      if (!csvFile) {
        alert(
          "Please select CSV file"
        );

        return;
      }

      try {
        const formData =
          new FormData();

        formData.append(
          "file",
          csvFile
        );

        formData.append(
          "uploadBatch",
          activeTab
        );

        await api.post(
          "/hr-calling-data/upload",
          formData
        );

        alert(
          `CSV uploaded successfully in Upload ${activeTab}`
        );

        setCsvFile(null);

        e.target.reset();

        await fetchCallingData();
      } catch (error) {
        console.error(error);

        alert(
          "Failed to upload CSV"
        );
      }
    };


  const handleDelete =
    async (id) => {
      if (
        !window.confirm(
          "Delete this calling data?"
        )
      ) {
        return;
      }

      try {
        await api.delete(
          `/hr-calling-data/${id}`
        );

        await fetchCallingData();
      } catch (error) {
        console.error(error);

        alert(
          "Failed to delete data"
        );
      }
    };


  const handleCandidateClick = (item) => {
    navigate(
      `/hr/tmc?callingDataId=${item._id}` + `&returnPage=calling-data` + `&returnTab=${activeTab}`
    );
  };

  const normalizeWhatsAppNumber = (number) => {
  let cleanNumber = String(
    number || ""
  ).replace(/\D/g, "");

  // Remove starting 0 from Indian mobile number
  if (
    cleanNumber.length === 11 &&
    cleanNumber.startsWith("0")
  ) {
    cleanNumber =
      cleanNumber.slice(1);
  }

  // Add India country code
  if (cleanNumber.length === 10) {
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

  const jobPortal =
    candidate?.jobPortal ||
    "the job portal";

  return `Hi ${candidateName},

Greetings from Conquest Techno Solutions.

We received your contact details through ${jobPortal} regarding a job opportunity.

We tried reaching you over the phone, but we were unable to connect with you.

If you are still interested in exploring the opportunity, please reply to this WhatsApp message or contact us when you are available.

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

  setShowWhatsAppPopup(true);
};

const handleCloseWhatsAppPopup = () => {
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
      selectedWhatsAppCandidate.contactNumber
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

  openedWindow.opener = null;

  handleCloseWhatsAppPopup();
};


  /*
   * Remove completely empty calling-data
   * records from the frontend.
   *
   * This also protects the page from old
   * blank records that may already exist
   * in MongoDB.
   */
  const validCallingData =
    useMemo(() => {
      return callingData.filter(
        (item) => {
          const hasCandidateData =
            Boolean(
              String(
                item.candidateName ||
                  ""
              ).trim() ||
                String(
                  item.contactNumber ||
                    ""
                ).trim() ||
                String(
                  item.jobPortal ||
                    ""
                ).trim() ||
                String(
                  item.qualification ||
                    ""
                ).trim() ||
                String(
                  item.location ||
                    ""
                ).trim() ||
                String(
                  item.experience ||
                    ""
                ).trim() ||
                String(
                  item.notes ||
                    ""
                ).trim()
            );

          return hasCandidateData;
        }
      );
    }, [callingData]);


  const filteredCallingData =
    useMemo(() => {
      const searchText =
        jobPortalSearch
          .trim()
          .toLowerCase();

      const filteredData =
        validCallingData.filter(
          (item) => {
            if (!searchText) {
              return true;
            }

            return String(
              item.jobPortal || ""
            )
              .toLowerCase()
              .includes(
                searchText
              );
          }
        );

      return [
        ...filteredData
      ].sort((a, b) => {
        const portalA =
          String(
            a.jobPortal || ""
          );

        const portalB =
          String(
            b.jobPortal || ""
          );

        const portalComparison =
          portalA.localeCompare(
            portalB,
            undefined,
            {
              sensitivity:
                "base"
            }
          );

        if (
          portalComparison !== 0
        ) {
          return (
            portalSortOrder ===
            "asc"
              ? portalComparison
              : -portalComparison
          );
        }

        return (
          (Number(
            a.serialNumber
          ) || 0) -
          (Number(
            b.serialNumber
          ) || 0)
        );
      });
    }, [
      validCallingData,
      jobPortalSearch,
      portalSortOrder
    ]);


  return (
    <div className="calling-data-page">
      <div className="calling-data-header">
        <h2>
          HR Calling Data
        </h2>

        <p>
          Upload, manage, and
          track HR calling data
        </p>
      </div>


      <div className="calling-tabs">
        {[1, 2, 3, 4].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              className={
                activeTab === tab
                  ? "active-tab"
                  : ""
              }
              onClick={() => {
                setActiveTab(tab);

                setJobPortalSearch(
                  ""
                );
              }}
            >
              Data {tab}
            </button>
          )
        )}
      </div>


      <form
        className="calling-upload-box"
        onSubmit={
          handleUpload
        }
      >
        <h3>
          Upload CSV - Data{" "}
          {activeTab}
        </h3>

        <input
          type="file"
          accept=".csv"
          onChange={(e) =>
            setCsvFile(
              e.target.files[0]
            )
          }
        />

        <button type="submit">
          Upload CSV
        </button>
      </form>


      <div className="calling-data-table-box">
        <h3>
          Calling Data{" "}
          {activeTab}
        </h3>


        <div className="job-portal-filter-section">
          <div className="job-portal-search-box">
            <label
              htmlFor="jobPortalSearch"
            >
              Filter by Job Portal
            </label>

            <input
              id="jobPortalSearch"
              type="text"
              value={
                jobPortalSearch
              }
              placeholder="Enter portal name, such as Foundit or Naukri"
              onChange={(e) =>
                setJobPortalSearch(
                  e.target.value
                )
              }
            />

            {jobPortalSearch && (
              <button
                type="button"
                className="clear-portal-filter-btn"
                onClick={() =>
                  setJobPortalSearch(
                    ""
                  )
                }
              >
                Clear
              </button>
            )}
          </div>


          <div className="portal-filter-details">
            <div className="portal-result-count">
              Showing{" "}

              <strong>
                {
                  filteredCallingData.length
                }
              </strong>

              {" "}of{" "}

              <strong>
                {
                  validCallingData.length
                }
              </strong>

              {" "}records
            </div>


            <div className="portal-sort-buttons">
              <span>
                Sort:
              </span>

              <button
                type="button"
                className={
                  portalSortOrder ===
                  "asc"
                    ? "active-sort-btn"
                    : ""
                }
                onClick={() =>
                  setPortalSortOrder(
                    "asc"
                  )
                }
              >
                A–Z
              </button>

              <button
                type="button"
                className={
                  portalSortOrder ===
                  "desc"
                    ? "active-sort-btn"
                    : ""
                }
                onClick={() =>
                  setPortalSortOrder(
                    "desc"
                  )
                }
              >
                Z–A
              </button>
            </div>
          </div>
        </div>


        {validCallingData.length ===
        0 ? (
          <p>
            No calling data
            uploaded in Data{" "}
            {activeTab}.
          </p>
        ) : filteredCallingData.length ===
          0 ? (
          <div className="no-portal-results">
            <p>
              No records found
              for job portal{" "}

              <strong>
                {
                  jobPortalSearch
                }
              </strong>
              .
            </p>

            <button
              type="button"
              onClick={() =>
                setJobPortalSearch(
                  ""
                )
              }
            >
              Show All Data
            </button>
          </div>
        ) : (
          <table className="calling-data-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Candidate Name</th>
                <th>Contact</th>
                <th>Job Portal</th>
                <th>Qualification</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Response 1</th>
                <th>Response 2</th>
                <th>Response 3</th>
                <th>Last Response</th>
                <th>WhatsApp</th>
                <th>Action</th>
              </tr>
            </thead>


            <tbody>
              {filteredCallingData.map(
                (
                  item,
                  index
                ) => (
                  <tr
                    key={
                      item._id
                    }
                    className={getLastResponseRowClass(item.lastResponse)}
                  >
                    <td>{item.serialNumber || index + 1}</td>

                    <td>
                      <button
                        type="button"
                        className="candidate-link-btn"
                        onClick={() =>
                          handleCandidateClick(
                            item
                          )
                        }
                      >
                        {item.candidateName ||
                          "-"}
                      </button>
                    </td>


                    <td>{item.contactNumber || "-"}</td>
                    <td>{item.jobPortal || "-"}</td>
                    <td>{item.qualification || "-"}</td>
                    <td>{item.location || "-"}</td>
                    <td>{item.experience || "-"}</td>
                    <td>{item.response1 || "-"}</td>
                    <td>{item.response2 || "-"}</td>
                    <td>{item.response3 || "-"}</td>
                    <td>{item.lastResponse || "-"}</td>

                    <td
                      className="hr-whatsapp-cell"
                    >
                    {item.contactNumber ? (
                    <button
                      type="button"
                      className="hr-whatsapp-btn"
                      onClick={(event) =>
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


                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(
                            item._id
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {showWhatsAppPopup &&
  selectedWhatsAppCandidate && (
    <div
      className="hr-whatsapp-popup-overlay"
      onClick={
        handleCloseWhatsAppPopup
      }
    >
      <div
        className="hr-whatsapp-popup"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="hr-whatsapp-popup-icon">
          WA
        </div>

        <h2>
          Send WhatsApp Message
        </h2>

        <p className="hr-whatsapp-popup-subtitle">
          Review the candidate
          details and message before
          opening WhatsApp.
        </p>

        <div className="hr-whatsapp-candidate-details">
          <div>
            <span>
              Candidate Name
            </span>

            <strong>
              {selectedWhatsAppCandidate.candidateName ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Contact Number
            </span>

            <strong>
              {selectedWhatsAppCandidate.contactNumber ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Job Portal
            </span>

            <strong>
              {selectedWhatsAppCandidate.jobPortal ||
                "-"}
            </strong>
          </div>
        </div>

        <div className="hr-whatsapp-message-preview">
          <span>
            Message Preview
          </span>

          <p>
            {getHrWhatsAppMessage(
              selectedWhatsAppCandidate
            )}
          </p>
        </div>

        <div className="hr-whatsapp-popup-actions">
          <button
            type="button"
            className="hr-whatsapp-close-btn"
            onClick={
              handleCloseWhatsAppPopup
            }
          >
            Close
          </button>

          <button
            type="button"
            className="hr-whatsapp-open-btn"
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


export default HrCallingDataPage;