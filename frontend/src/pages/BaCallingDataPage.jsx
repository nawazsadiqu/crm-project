import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/baCallingData.css";

const BaCallingDataPage = () => {
  const [data, setData] = useState([]);
  const [contactNumbers, setContactNumbers] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedWeek, setSelectedWeek] = useState(() => {
  return sessionStorage.getItem("baSelectedWeek") || "1";
});
  const [weekSummary, setWeekSummary] = useState([]);

  const navigate = useNavigate();

  const handleWeekChange = (week) => {
  const weekValue = String(week);
  sessionStorage.setItem("baSelectedWeek", weekValue);
  setSelectedWeek(weekValue);
};

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
  `/calling-data/my?weekNumber=${selectedWeek}`
);

const callingData = Array.isArray(data)
  ? data
  : Array.isArray(data.records)
  ? data.records
  : [];

setData(sortCallingData(callingData));

setWeekSummary(data.weekSummary || []);

      const numbers = {};
      callingData.forEach((item) => {
        numbers[item._id] = item.contactNumber || "";
      });

      setContactNumbers(numbers);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch calling data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchData();
}, [selectedWeek]);

  const handleContactNumberChange = (id, value) => {
    setContactNumbers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleContactNumberSave = async (id) => {
  try {
    const newContactNumber = contactNumbers[id] || "";

    await api.put(`/calling-data/${id}/contact-number`, {
      contactNumber: newContactNumber
    });

    await refreshCallingData();

    setMessage("Contact number updated successfully");
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to update contact number"
    );
  }
};

  const handleRowClick = (item) => {
  navigate("/ba/tmc", {
    state: {
      returnTo: "/ba/calling-data",
      callingData: item
    },
  });
};

  const getMapLink = (link) => {
    if (!link) return "";
    return link.startsWith("http") ? link : `https://${link}`;
  };

  const handleIgnoredChange = async (id, checked) => {
  try {
    await api.put(`/calling-data/${id}/ignored`, {
      isIgnored: checked
    });

    await refreshCallingData();

    setMessage("Calling data updated successfully");
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to update calling data"
    );
  }
};

// const shouldCallAgain = (item) => {
//   const noNeedToCallStatuses = ["AP","NI","CC","CTS_CLIENT"];

//   const status =
//     getLastStatusCode(item);

//   if (!status) {
//     return false;
//   }

//   return !noNeedToCallStatuses.includes(
//     status
//   );
// };

const statusFilterOptions = [
  { label: "All Status", value: "ALL" },
  { label: "Appointment", value: "AP" },
  { label: "Call Back for Appointment", value: "CBA" },
  { label: "Call Back for Presentation", value: "CBP" },
  { label: "Customer Call Back", value: "CCB" },
  { label: "Not Interested", value: "NI" },
  { label: "Cut the Call", value: "CC" },
  { label: "Not Connected", value: "NC" },
  { label: "Not Answered", value: "NA" },
  { label: "Postponed", value: "P" },
  { label: "CTS Client", value: "CTS_CLIENT" }
];

const normalizeStatusCode = (value) => {
  const status = String(value || "").trim().toUpperCase();

  if (!status) return "";

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

const getLastStatusCode = (item) => {
  if (item.lastStatus) {
    return normalizeStatusCode(item.lastStatus);
  }

  const lastResponseText = String(item.lastResponse || "");
  const match = lastResponseText.match(/Status:\s*([^,\n|]+)/i);

  return match ? normalizeStatusCode(match[1]) : "";
};

const getResponseStatusCode = (response) => {
  const responseText = String(
    response || ""
  );

  if (!responseText.trim()) {
    return "";
  }

  const match = responseText.match(
    /Status:\s*([^,\n|]+)/i
  );

  return match
    ? normalizeStatusCode(match[1])
    : "";
};

const getNoAnswerAttemptCount = (item) => {
  const responseStatuses = [
    item.response1,
    item.response2,
    item.response3,
    item.lastResponse
  ].map(getResponseStatusCode);

  return responseStatuses.filter(
    (status) =>
      status === "NC" ||
      status === "NA"
  ).length;
};

const isCallingDataDone = (item) => {
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

  const hasFourResponses = Boolean(
    String(item.response1 || "").trim() &&
    String(item.response2 || "").trim() &&
    String(item.response3 || "").trim() &&
    String(item.lastResponse || "").trim()
  );

  const hasThreeNoAnswerAttempts =
    getNoAnswerAttemptCount(item) >= 3;

  const isMarkedNoNeed =
    Boolean(item.isIgnored);

  return (
    isCompletedByStatus ||
    hasFourResponses ||
    hasThreeNoAnswerAttempts ||
    isMarkedNoNeed
  );
};

const shouldCallAgain = (item) => {
  if (isCallingDataDone(item)) {
    return false;
  }

  const noCallAgainStatuses = [
    "CC"
  ];

  const status =
    getLastStatusCode(item);

  if (!status) {
    return false;
  }

  return !noCallAgainStatuses.includes(
    status
  );
};

const matchesStatusFilter = (item) => {
  if (selectedStatusFilter === "ALL") {
    return true;
  }

  const lastStatusCode =
    getLastStatusCode(item);

  return (
    lastStatusCode ===
    selectedStatusFilter
  );
};

const filteredData = data.filter((item) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    !search ||
    item.businessName?.toLowerCase().includes(search) ||
    item.contactNumber?.toLowerCase().includes(search) ||
    item.mapLink?.toLowerCase().includes(search) ||
    item.response1?.toLowerCase().includes(search) ||
    item.response2?.toLowerCase().includes(search) ||
    item.response3?.toLowerCase().includes(search) ||
    item.lastResponse?.toLowerCase().includes(search) ||
    item.lastStatus?.toLowerCase().includes(search);

  return matchesSearch && matchesStatusFilter(item);
});



const totalCallingData =
  data.length;

const completedCallingData =
  data.filter((item) =>
    isCallingDataDone(item)
  );

const pendingCallingData =
  data.filter((item) =>
    !isCallingDataDone(item)
  );

const completedCallingDataCount =
  completedCallingData.length;

const pendingCallingDataCount =
  pendingCallingData.length;

const completionPercentage =
  totalCallingData > 0
    ? Math.round(
        (completedCallingDataCount /
          totalCallingData) *
          100
      )
    : 0;

const hasResponse = (item) => {
  return Boolean(
    item.response1 ||
    item.response2 ||
    item.response3 ||
    item.lastResponse ||
    item.lastStatus
  );
};

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

const getFullResponse = (response) => {
  if (!response) return "-";

  let fullResponse = response;

  Object.entries(responseFullFormMap).forEach(([shortForm, fullForm]) => {
    const regex = new RegExp(`Status:\\s*${shortForm}\\b`, "g");
    fullResponse = fullResponse.replace(regex, `Status: ${fullForm}`);
  });

  return fullResponse;
};

// NC = Not Connected.
//
// NL, B, S and NA are treated as the "Not Answered" group,
// matching the existing NOT_ANSWERED status filter.
const callAgainTopStatuses = [
  "NC",
  "NA"
];

const isCallAgainTopStatus = (item) => {
  const status = getLastStatusCode(item);

  return callAgainTopStatuses.includes(status);
};

// Converts a date into YYYY-MM-DD using local time.
const getLocalDateKey = (dateValue = new Date()) => {
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Gets the date of the most recently saved call response.
const getLatestResponseDateKey = (item) => {
  const responseDates = [
    item.lastResponseDate,
    item.response3Date,
    item.response2Date,
    item.response1Date,
  ]
    .filter(Boolean)
    .map((value) => getLocalDateKey(value))
    .filter(Boolean);

  if (responseDates.length === 0) {
    return "";
  }

  responseDates.sort();

  return responseDates[responseDates.length - 1];
};

// These records will move to the top only from the next day.
const shouldMoveToTopFromTomorrow = (
  item,
  todayDateKey
) => {
  if (isCallingDataDone(item)) {
    return false;
  }

  if (!isCallAgainTopStatus(item)) {
    return false;
  }

  const latestResponseDateKey =
    getLatestResponseDateKey(item);

  return (
    Boolean(latestResponseDateKey) &&
    latestResponseDateKey < todayDateKey
  );
};

const sortCallingData = (list) => {
  const todayDateKey = getLocalDateKey();

  return [...list].sort((a, b) => {
    // 1. "No Need" checked records always remain at the bottom.
    if (Boolean(a.isIgnored) !== Boolean(b.isIgnored)) {
      return a.isIgnored ? 1 : -1;
    }

    const aMoveToTop =
      shouldMoveToTopFromTomorrow(
        a,
        todayDateKey
      );

    const bMoveToTop =
      shouldMoveToTopFromTomorrow(
        b,
        todayDateKey
      );

    // 2. Yesterday's or older Not Connected / Not Answered
    // records come above all data, including untouched data.
    if (aMoveToTop !== bMoveToTop) {
      return aMoveToTop ? -1 : 1;
    }

    // 3. Among pending follow-up records,
    // show the oldest pending call first.
    if (aMoveToTop && bMoveToTop) {
      const aDate =
        getLatestResponseDateKey(a);

      const bDate =
        getLatestResponseDateKey(b);

      if (aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
    }

    const aHasResponse = hasResponse(a);
    const bHasResponse = hasResponse(b);

    // 4. Untouched records come before normal responded records.
    //
    // A Not Connected / Not Answered response entered today
    // remains below untouched records today.
    //
    // It will move above untouched records tomorrow.
    if (aHasResponse !== bHasResponse) {
      return aHasResponse ? 1 : -1;
    }

    // 5. Maintain serial-number order within each group.
    return (
      Number(a.serialNumber || 0) -
      Number(b.serialNumber || 0)
    );
  });
};

const downloadCSV = () => {
  const rows = filteredData.map((item, index) => ({
    "Sl No": item.serialNumber || index + 1,
    "Business Name": item.businessName || "",
    "Map Link": item.mapLink || "",
    "Contact Number": contactNumbers[item._id] || item.contactNumber || "",
    "Response 1": item.response1 || "",
    "Response 2": item.response2 || "",
    "Response 3": item.response3 || "",
    "Last Response": item.lastResponse || "",
    "Last Status": item.lastStatus || "",
    "No Need": item.isIgnored ? "Yes" : "No",
  }));

  const headers = Object.keys(rows[0] || {});
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", "calling-data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const weekTabs = [1, 2, 3, 4, 5];

const getWeekUploadedDate = (week) => {
  const item = weekSummary.find(
    (row) => Number(row._id) === Number(week)
  );

  if (!item?.uploadedAt) return "";

  return new Date(item.uploadedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const refreshCallingData = async () => {
  const { data } = await api.get(
    `/calling-data/my?weekNumber=${selectedWeek}`
  );

  const callingData = Array.isArray(data)
    ? data
    : Array.isArray(data.records)
    ? data.records
    : [];

  setData(sortCallingData(callingData));

  const numbers = {};
  callingData.forEach((item) => {
    numbers[item._id] = item.contactNumber || "";
  });

  setContactNumbers(numbers);
  setWeekSummary(data.weekSummary || []);
};
  return (
    <div className="ba-calling-page">
      <div className="ba-calling-card">
        <div className="ba-calling-header">
  <div className="ba-calling-filter-row">
    <div className="ba-calling-search">
      <input
        type="text"
        placeholder="Search by business name, number, map, response..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <div className="ba-calling-status-filter-wrap">
  <div className="ba-calling-status-filter">
    <select
      value={selectedStatusFilter}
      onChange={(e) =>
        setSelectedStatusFilter(
          e.target.value
        )
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
  </div>

  <div className="ba-calling-filter-count">
  {filteredData.length}
</div>
</div>
  </div>

  <div className="ba-calling-title-block">
    <h2>Calling Data</h2>
    <p>Assigned business leads for calling</p>
  </div>

  <div className="week-tabs">
    {weekTabs.map((week) => (
      <button
        key={week}
        type="button"
        className={`week-tab-btn ${
          Number(selectedWeek) === week ? "active" : ""
        }`}
        onClick={() => handleWeekChange(week)}
      >
        <span>Week {week}</span>
        <small>{getWeekUploadedDate(week) || "No upload"}</small>
      </button>
    ))}
  </div>
</div>

        {message && <p className="ba-calling-message">{message}</p>}

        <div className="ba-calling-summary-grid">
  <div className="ba-calling-summary-card total">
    <span>Total Data</span>
    <strong>
      {totalCallingData}
    </strong>
  </div>

  <div className="ba-calling-summary-card completed">
    <span>Data Done</span>
    <strong>
      {completedCallingDataCount}
    </strong>
  </div>

  <div className="ba-calling-summary-card pending">
    <span>Left to Work On</span>
    <strong>
      {pendingCallingDataCount}
    </strong>
  </div>

  <div className="ba-calling-summary-card percentage">
    <span>Completed</span>
    <strong>
      {completionPercentage}%
    </strong>
  </div>
</div>

        {loading ? (
          <p className="ba-calling-loading">Loading...</p>
        ) : filteredData.length === 0 ? (
          <p className="ba-calling-empty">No calling data available</p>
        ) : (
          <div className="ba-calling-table-wrap">
            <table className="ba-calling-table">
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
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => (
                  <tr
  key={item._id}
  onClick={() => handleRowClick(item)}
  className={`clickable-row ${
    shouldCallAgain(item) ? "call-again-highlight" : ""
  }`}
>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={item.isIgnored || false}
                        onChange={(e) => handleIgnoredChange(item._id, e.target.checked)}
                      />
                    </td>
                    <td>{item.serialNumber || index + 1}</td>

                    <td>{item.businessName}</td>

                    <td>
                      {item.mapLink ? (
                        <a
                          href={getMapLink(item.mapLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="map-link"
                        >
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={contactNumbers[item._id] || ""}
                        onChange={(e) =>
                          handleContactNumberChange(item._id, e.target.value)
                        }
                        onBlur={() => handleContactNumberSave(item._id)}
                        className="contact-edit-input"
                        placeholder="Enter number"
                      />
                    </td>

                    <td>{getFullResponse(item.response1)}</td>
                    <td>{getFullResponse(item.response2)}</td>
                    <td>{getFullResponse(item.response3)}</td>
                    <td>{getFullResponse(item.lastResponse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaCallingDataPage;