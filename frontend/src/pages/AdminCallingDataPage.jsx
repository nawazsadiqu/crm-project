import { useEffect, useState } from "react";
import Papa from "papaparse";
import api from "../services/api";
import "../css/adminCallingData.css";

const AdminCallingDataPage = () => {
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState("");

  const [viewAssignedTo, setViewAssignedTo] = useState("");

  const [viewWeekNumber, setViewWeekNumber] = useState("1");

  const [callingData, setCallingData] = useState([]);

  const [weekSummary, setWeekSummary] = useState([]);

  const [callingDataLoading, setCallingDataLoading] = useState(false);

  const [viewMessage, setViewMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [monthKey, setMonthKey] = useState(currentMonth);
  const [weekNumber, setWeekNumber] = useState("1");

  const statusFilterOptions = [
  {
    label: "All Status",
    value: "ALL"
  },
  {
    label: "Appointment",
    value: "AP"
  },
  {
    label:
      "Call Back for Appointment",
    value: "CBA"
  },
  {
    label:
      "Call Back for Presentation",
    value: "CBP"
  },
  {
    label:
      "Customer Call Back",
    value: "CCB"
  },
  {
    label: "Not Interested",
    value: "NI"
  },
  {
    label: "Cut the Call",
    value: "CC"
  },
  {
    label: "Not Connected",
    value: "NC"
  },
  {
    label: "Not Answered",
    value: "NA"
  },
  {
    label: "Postponed",
    value: "P"
  },
  {
    label: "CTS Client",
    value: "CTS_CLIENT"
  }
];

const responseFullFormMap = {
  AP: "Appointment",
  CBA: "Call Back for Appointment",
  CBP: "Call Back for Presentation",
  CCB: "Customer Call Back",
  NI: "Not Interested",
  CC: "Cut the Call",
  NC: "Not Connected",
  NA: "Not Answered",
  P: "Postponed",
  CTS_CLIENT: "CTS Client"
};

const normalizeStatusCode = (
  value
) => {
  const status = String(
    value || ""
  )
    .trim()
    .toUpperCase();

  if (!status) {
    return "";
  }

  if (
    status === "CTS_CLIENT" ||
    status === "CTS-CLIENT" ||
    status === "CTS CLIENT" ||
    status.includes("CTS CLIENT")
  ) {
    return "CTS_CLIENT";
  }

  return status;
};

const getLastStatusCode = (
  item
) => {
  if (item.lastStatus) {
    return normalizeStatusCode(
      item.lastStatus
    );
  }

  const lastResponseText =
    String(
      item.lastResponse || ""
    );

  const match =
    lastResponseText.match(
      /Status:\s*([^,\n|]+)/i
    );

  return match
    ? normalizeStatusCode(
        match[1]
      )
    : "";
};

const getResponseStatusCode = (
  response
) => {
  const responseText =
    String(response || "");

  if (!responseText.trim()) {
    return "";
  }

  const match =
    responseText.match(
      /Status:\s*([^,\n|]+)/i
    );

  return match
    ? normalizeStatusCode(
        match[1]
      )
    : "";
};

const getNoAnswerAttemptCount = (
  item
) => {
  const statuses = [
    item.response1,
    item.response2,
    item.response3,
    item.lastResponse
  ].map(getResponseStatusCode);

  return statuses.filter(
    (status) =>
      status === "NC" ||
      status === "NA"
  ).length;
};

/*
  This is the same existing completion
  logic used by BaCallingDataPage.
*/
const isCallingDataDone = (
  item
) => {
  const lastStatusCode =
    getLastStatusCode(item);

  const completedStatuses = [
    "AP",
    "NI",
    "REJECTED",
    "CTS_CLIENT"
  ];

  const isCompletedByStatus =
    completedStatuses.includes(
      lastStatusCode
    );

  const hasFourResponses =
    Boolean(
      String(
        item.response1 || ""
      ).trim() &&
        String(
          item.response2 || ""
        ).trim() &&
        String(
          item.response3 || ""
        ).trim() &&
        String(
          item.lastResponse || ""
        ).trim()
    );

  const hasThreeNoAnswerAttempts =
    getNoAnswerAttemptCount(
      item
    ) >= 3;

  return (
    isCompletedByStatus ||
    hasFourResponses ||
    hasThreeNoAnswerAttempts ||
    Boolean(item.isIgnored)
  );
};

const hasResponse = (item) => {
  return Boolean(
    item.response1 ||
      item.response2 ||
      item.response3 ||
      item.lastResponse ||
      item.lastStatus
  );
};

const getLocalDateKey = (
  dateValue = new Date()
) => {
  const parsedDate =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  const year =
    parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLatestResponseDateKey = (
  item
) => {
  const responseDates = [
    item.lastResponseDate,
    item.response3Date,
    item.response2Date,
    item.response1Date
  ]
    .filter(Boolean)
    .map((value) =>
      getLocalDateKey(value)
    )
    .filter(Boolean);

  if (
    responseDates.length === 0
  ) {
    return "";
  }

  responseDates.sort();

  return responseDates[
    responseDates.length - 1
  ];
};

const isCallAgainTopStatus = (
  item
) => {
  const status =
    getLastStatusCode(item);

  return [
    "NC",
    "NA"
  ].includes(status);
};

const shouldMoveToTopFromTomorrow = (
  item,
  todayDateKey
) => {
  if (isCallingDataDone(item)) {
    return false;
  }

  if (
    !isCallAgainTopStatus(item)
  ) {
    return false;
  }

  const latestResponseDateKey =
    getLatestResponseDateKey(
      item
    );

  return (
    Boolean(
      latestResponseDateKey
    ) &&
    latestResponseDateKey <
      todayDateKey
  );
};

const sortCallingData = (
  records
) => {
  const todayDateKey =
    getLocalDateKey();

  return [...records].sort(
    (first, second) => {
      if (
        Boolean(
          first.isIgnored
        ) !==
        Boolean(
          second.isIgnored
        )
      ) {
        return first.isIgnored
          ? 1
          : -1;
      }

      const firstMoveToTop =
        shouldMoveToTopFromTomorrow(
          first,
          todayDateKey
        );

      const secondMoveToTop =
        shouldMoveToTopFromTomorrow(
          second,
          todayDateKey
        );

      if (
        firstMoveToTop !==
        secondMoveToTop
      ) {
        return firstMoveToTop
          ? -1
          : 1;
      }

      if (
        firstMoveToTop &&
        secondMoveToTop
      ) {
        const firstDate =
          getLatestResponseDateKey(
            first
          );

        const secondDate =
          getLatestResponseDateKey(
            second
          );

        if (
          firstDate !==
          secondDate
        ) {
          return firstDate.localeCompare(
            secondDate
          );
        }
      }

      const firstHasResponse =
        hasResponse(first);

      const secondHasResponse =
        hasResponse(second);

      if (
        firstHasResponse !==
        secondHasResponse
      ) {
        return firstHasResponse
          ? 1
          : -1;
      }

      return (
        Number(
          first.serialNumber || 0
        ) -
        Number(
          second.serialNumber || 0
        )
      );
    }
  );
};

const getFullResponse = (
  response
) => {
  if (!response) {
    return "-";
  }

  let fullResponse =
    response;

  Object.entries(
    responseFullFormMap
  ).forEach(
    ([
      shortForm,
      fullForm
    ]) => {
      const regex =
        new RegExp(
          `Status:\\s*${shortForm}\\b`,
          "g"
        );

      fullResponse =
        fullResponse.replace(
          regex,
          `Status: ${fullForm}`
        );
    }
  );

  return fullResponse;
};

const getStatusLabel = (
  status
) => {
  const normalizedStatus =
    normalizeStatusCode(status);

  return (
    responseFullFormMap[
      normalizedStatus
    ] ||
    status ||
    "-"
  );
};

const getMapLink = (link) => {
  if (!link) {
    return "";
  }

  return link.startsWith("http")
    ? link
    : `https://${link}`;
};

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");

      const usersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : Array.isArray(data.data)
        ? data.data
        : [];

      setUsers(usersArray);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to fetch users");
    }
  };

  const fetchBaCallingData =
  async () => {
    if (!viewAssignedTo) {
      setCallingData([]);
      setWeekSummary([]);
      setViewMessage("");
      return;
    }

    try {
      setCallingDataLoading(
        true
      );

      const { data } =
        await api.get(
          "/calling-data/admin-view",
          {
            params: {
              assignedTo:
                viewAssignedTo,
              weekNumber:
                viewWeekNumber
            }
          }
        );

      const records =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data.records
            )
          ? data.records
          : [];

      setCallingData(
        sortCallingData(records)
      );

      setWeekSummary(
        Array.isArray(
          data.weekSummary
        )
          ? data.weekSummary
          : []
      );

      setViewMessage("");
    } catch (error) {
      setCallingData([]);
      setWeekSummary([]);

      setViewMessage(
        error.response?.data
          ?.message ||
          "Failed to fetch BA calling data"
      );
    } finally {
      setCallingDataLoading(
        false
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
  fetchBaCallingData();
}, [
  viewAssignedTo,
  viewWeekNumber
]);

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map((row) => ({
          businessName:
            row["Business Name"] ||
            row["businessName"] ||
            row["Business"] ||
            "",
          mapLink:
            row["Map Link"] ||
            row["Google Map Link"] ||
            row["mapLink"] ||
            "",
          contactNumber:
            row["Contact Number"] ||
            row["Phone"] ||
            row["Mobile"] ||
            row["Mob No"] ||
            row["contactNumber"] ||
            ""
        }));

        const validRows = parsedData.filter((item) =>
          item.businessName.trim()
        );

        setPreviewData(validRows);
        setMessage(`${validRows.length} records loaded from CSV`);
      },
      error: () => {
        setMessage("Failed to read CSV file");
      }
    });
  };

  const handleUpload = async () => {
    try {
      if (!assignedTo) {
        setMessage("Please select a BA");
        return;
      }

      if (!monthKey) {
        setMessage("Please select month");
        return;
      }

      if (!weekNumber) {
        setMessage("Please select week");
        return;
      }

      if (previewData.length === 0) {
        setMessage("Please upload a CSV file before saving");
        return;
      }

      const { data } = await api.post("/calling-data/bulk", {
        assignedTo,
        monthKey,
        weekNumber: Number(weekNumber),
        data: previewData
      });

      setMessage(data.message || "Calling data uploaded successfully");
      setPreviewData([]);
      setAssignedTo("");
      setWeekNumber("1");
      } catch (error) {
      setMessage(error.response?.data?.message || "Failed to upload calling data");
      }
    };

    const baUsers = users.filter(
      (user) => String(user.role || "").toLowerCase().trim() === "ba"
    );

    const filteredCallingData =
  callingData.filter(
    (item) => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        String(
          item.businessName || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.contactNumber ||
            ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.mapLink || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.response1 || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.response2 || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.response3 || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.lastResponse ||
            ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          item.lastStatus || ""
        )
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        selectedStatusFilter ===
          "ALL" ||
        getLastStatusCode(item) ===
          selectedStatusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

const totalCallingData =
  callingData.length;

const completedCallingDataCount =
  callingData.filter(
    isCallingDataDone
  ).length;

const pendingCallingDataCount =
  totalCallingData -
  completedCallingDataCount;

const completionPercentage =
  totalCallingData > 0
    ? Math.round(
        (
          completedCallingDataCount /
          totalCallingData
        ) * 100
      )
    : 0;

const getWeekUploadedDate = (
  selectedWeek
) => {
  const week = weekSummary.find(
    (item) =>
      Number(item._id) ===
      Number(selectedWeek)
  );

  if (!week?.uploadedAt) {
    return "";
  }

  return new Date(
    week.uploadedAt
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
};

  return (
    <div className="admin-calling-page">
      <div className="admin-calling-card">
        <div className="admin-calling-header">
          <div>
            <h2>Calling Data Upload</h2>
            <p>Assign CSV calling data to a specific BA</p>
          </div>
        </div>

        {message && <p className="admin-calling-message">{message}</p>}

        <div className="admin-calling-form">
        <div className="admin-calling-field">
        <label>Select BA</label>

        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
        <option value="">Select BA</option>

        {baUsers.map((user) => (
        <option key={user._id} value={user._id}>
          {user.name || "No Name"} - {user.email || "No Email"}
        </option>
      ))}
    </select>
  </div>

  <div className="admin-calling-field">
    <label>Select Month</label>

    <input
      type="month"
      value={monthKey}
      onChange={(e) => setMonthKey(e.target.value)}
    />
  </div>

  <div className="admin-calling-field">
    <label>Select Week</label>

    <select
      value={weekNumber}
      onChange={(e) => setWeekNumber(e.target.value)}
    >
      <option value="1">Week 1</option>
      <option value="2">Week 2</option>
      <option value="3">Week 3</option>
      <option value="4">Week 4</option>
      <option value="5">Week 5</option>
    </select>
  </div>

  <div className="admin-calling-field">
    <label>Upload CSV File</label>

    <input
      type="file"
      accept=".csv"
      onChange={handleCsvUpload}
    />
  </div>

  <div className="admin-calling-actions">
    <button
      className="btn btn-primary"
      onClick={handleUpload}
    >
      Upload Data
    </button>
  </div>
</div>

        {previewData.length > 0 && (
          <div className="admin-calling-preview">
            <h3>Preview ({previewData.length})</h3>

            <div className="admin-calling-table-wrap">
              <table className="admin-calling-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Map Link</th>
                    <th>Contact Number</th>
                  </tr>
                </thead>

                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.businessName}</td>
                      <td>{item.mapLink || "-"}</td>
                      <td>{item.contactNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        )}
        <div className="admin-calling-view-section">
  <div className="admin-calling-view-header">
    <div>
      <h2>
        View BA Calling Data
      </h2>

      <p>
        View the same calling data,
        responses and statuses saved by
        the selected BA
      </p>
    </div>
  </div>

  <div className="admin-calling-view-filters">
    <div className="admin-calling-field">
      <label>Select BA</label>

      <select
        value={viewAssignedTo}
        onChange={(event) => {
          setViewAssignedTo(
            event.target.value
          );

          setSearchTerm("");
          setSelectedStatusFilter(
            "ALL"
          );
        }}
      >
        <option value="">
          Select BA
        </option>

        {baUsers.map((user) => (
          <option
            key={user._id}
            value={user._id}
          >
            {user.name ||
              "No Name"}{" "}
            -{" "}
            {user.email ||
              "No Email"}
          </option>
        ))}
      </select>
    </div>

    <div className="admin-calling-view-search">
      <label>Search</label>

      <input
        type="text"
        placeholder="Search business, contact or response..."
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(
            event.target.value
          )
        }
        disabled={!viewAssignedTo}
      />
    </div>

    <div className="admin-calling-view-status">
      <label>Status</label>

      <div className="admin-calling-view-status-row">
        <select
          value={
            selectedStatusFilter
          }
          onChange={(event) =>
            setSelectedStatusFilter(
              event.target.value
            )
          }
          disabled={
            !viewAssignedTo
          }
        >
          {statusFilterOptions.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <span className="admin-calling-filter-count">
          {
            filteredCallingData.length
          }
        </span>
      </div>
    </div>
  </div>

  {viewAssignedTo && (
    <div className="admin-calling-week-tabs">
      {[1, 2, 3, 4, 5].map(
        (week) => (
          <button
            key={week}
            type="button"
            className={`admin-calling-week-btn ${
              Number(
                viewWeekNumber
              ) === week
                ? "active"
                : ""
            }`}
            onClick={() =>
              setViewWeekNumber(
                String(week)
              )
            }
          >
            <span>
              Week {week}
            </span>

            <small>
              {getWeekUploadedDate(
                week
              ) || "No upload"}
            </small>
          </button>
        )
      )}
    </div>
  )}

  {viewMessage && (
    <p className="admin-calling-message">
      {viewMessage}
    </p>
  )}

  {viewAssignedTo && (
    <div className="admin-calling-summary-grid">
      <div className="admin-calling-summary-card total">
        <span>Total Data</span>

        <strong>
          {totalCallingData}
        </strong>
      </div>

      <div className="admin-calling-summary-card completed">
        <span>Data Done</span>

        <strong>
          {
            completedCallingDataCount
          }
        </strong>
      </div>

      <div className="admin-calling-summary-card pending">
        <span>
          Left to Work On
        </span>

        <strong>
          {
            pendingCallingDataCount
          }
        </strong>
      </div>

      <div className="admin-calling-summary-card percentage">
        <span>Completed</span>

        <strong>
          {
            completionPercentage
          }%
        </strong>
      </div>
    </div>
  )}

  {!viewAssignedTo ? (
    <div className="admin-calling-view-empty">
      Select a BA to view calling
      data
    </div>
  ) : callingDataLoading ? (
    <div className="admin-calling-view-empty">
      Loading calling data...
    </div>
  ) : filteredCallingData.length ===
    0 ? (
    <div className="admin-calling-view-empty">
      No calling data available
    </div>
  ) : (
    <div className="admin-calling-full-table-wrap">
      <table className="admin-calling-full-table">
        <thead>
          <tr>
            <th>No Need</th>
            <th>Sl No</th>
            <th>Business Name</th>
            <th>Map Link</th>
            <th>Contact</th>
            <th>Response 1</th>
            <th>Response 2</th>
            <th>Response 3</th>
            <th>Last Response</th>
            <th>Last Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredCallingData.map(
            (item, index) => (
              <tr
                key={item._id}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={
                      Boolean(
                        item.isIgnored
                      )
                    }
                    disabled
                    readOnly
                  />
                </td>

                <td>
                  {item.serialNumber ||
                    index + 1}
                </td>

                <td>
                  {item.businessName ||
                    "-"}
                </td>

                <td>
                  {item.mapLink ? (
                    <a
                      href={getMapLink(
                        item.mapLink
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Map
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {item.contactNumber ||
                    "-"}
                </td>

                <td>
                  {getFullResponse(
                    item.response1
                  )}
                </td>

                <td>
                  {getFullResponse(
                    item.response2
                  )}
                </td>

                <td>
                  {getFullResponse(
                    item.response3
                  )}
                </td>

                <td>
                  {getFullResponse(
                    item.lastResponse
                  )}
                </td>

                <td>
                  {getStatusLabel(
                    item.lastStatus
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )}
</div>
      </div>
    </div>
  );
};

export default AdminCallingDataPage;