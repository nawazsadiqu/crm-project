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

const shouldCallAgain = (item) => {
  const noNeedToCallStatuses = ["AP", "NI", "CC"];

  if (!item.lastStatus) return false;

  return !noNeedToCallStatuses.includes(item.lastStatus);
};

const filteredData = data.filter((item) => {
  const search = searchTerm.toLowerCase();

  return (
    item.businessName?.toLowerCase().includes(search) ||
    item.contactNumber?.toLowerCase().includes(search) ||
    item.mapLink?.toLowerCase().includes(search) ||
    item.response1?.toLowerCase().includes(search) ||
    item.response2?.toLowerCase().includes(search) ||
    item.response3?.toLowerCase().includes(search) ||
    item.lastResponse?.toLowerCase().includes(search)
  );
});

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
  CC: "Cut the Call",
  NI: "Not Interested",
  CCB: "Customer Call Back",
  NL: "Not Lifting",
  B: "Busy",
  NC: "Not Connected",
  S: "Switched Off",
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

const sortCallingData = (list) => {
  return [...list].sort((a, b) => {
    if (!!a.isIgnored !== !!b.isIgnored) {
      return a.isIgnored ? 1 : -1;
    }

    if (hasResponse(a) !== hasResponse(b)) {
      return hasResponse(a) ? 1 : -1;
    }

    return (a.serialNumber || 0) - (b.serialNumber || 0);
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
          <div className="ba-calling-search">
  <input
    type="text"
    placeholder="Search by business name, number, map, response..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
          <div>
            <h2>Calling Data</h2>
            <p>Assigned business leads for calling</p>
          </div>
          <button
  type="button"
  className="btn btn-primary"
  onClick={downloadCSV}
>
  Download CSV
</button>
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