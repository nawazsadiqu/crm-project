import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../css/TelecallerCallingDataPage.css";

const TelecallerCallingDataPage = () => {
  const { user } = useAuth();

  const telecallerCategory = user?.telecallerCategory || "";
  const [data, setData] = useState([]);
  const [contactNumbers, setContactNumbers] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedWeek, setSelectedWeek] = useState(() => {
    return sessionStorage.getItem("telecallerSelectedWeek") || "1";
  });
  const [weekSummary, setWeekSummary] = useState([]);

  const [
    showWhatsAppPopup,
    setShowWhatsAppPopup
  ] = useState(false);

  const [
    selectedWhatsAppLead,
    setSelectedWhatsAppLead
  ] = useState(null);

  const [
    showIgnoredReasonPopup,
    setShowIgnoredReasonPopup
  ] = useState(false);

  const [
    selectedIgnoredRecord,
    setSelectedIgnoredRecord
  ] = useState(null);

  const [
    selectedIgnoredReason,
    setSelectedIgnoredReason
  ] = useState("");

  const [
    savingIgnoredId,
    setSavingIgnoredId
  ] = useState("");

  const getIgnoredReasonLabel = (reason) => {
    const reasonMap = {
      NO_CONTACT: "No Contact",
      REPEATED: "Repeated"
    };

    return reasonMap[reason] || "";
  };

  const navigate = useNavigate();

  const handleWeekChange = (week) => {
    const weekValue = String(week);
    sessionStorage.setItem(
      "telecallerSelectedWeek",
      weekValue
    );
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
    navigate("/telecaller/tmc", {
      state: {
        returnTo: "/telecaller/calling-data",
        callingData: item
      }
    });
  };

  const getMapLink = (link) => {
    if (!link) return "";
    return link.startsWith("http") ? link : `https://${link}`;
  };

  const normalizeWhatsAppNumber = (
    number
  ) => {
    let cleanNumber = String(
      number || ""
    ).replace(/\D/g, "");

    // Remove starting zero from Indian mobile numbers
    if (
      cleanNumber.length === 11 &&
      cleanNumber.startsWith("0")
    ) {
      cleanNumber = cleanNumber.slice(1);
    }

    // Add India country code
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    if (
      cleanNumber.length < 10 ||
      cleanNumber.length > 15
    ) {
      return "";
    }

    return cleanNumber;
  };


  const getWhatsAppMessage = () => {

    let serviceMessage = "";

    switch (telecallerCategory) {

      case "GBP":
        serviceMessage = `We tried reaching you regarding Google Business Profile management and Local SEO services for your business.

Our services help businesses improve their visibility on Google Search and Google Maps, strengthen their online presence and attract more potential customers.

Please let us know a convenient time to connect so we can explain how our services can benefit your business.`;
        break;

      case "WEBSITE":
        serviceMessage = `We tried reaching you regarding professional website development services for your business.

We develop responsive, mobile-friendly and SEO-friendly websites designed to showcase your products and services, build customer trust and generate business enquiries.

Please let us know a convenient time to discuss your website requirements.`;
        break;

      case "WHATSAPP_BROADCAST":
        serviceMessage = `We tried reaching you regarding our WhatsApp Broadcast Manager.

Our software helps businesses send promotional messages, offers, product updates and announcements to opted-in customers, manage campaigns and improve customer engagement.

Please let us know a convenient time to connect for a product demonstration.`;
        break;

      default:
        serviceMessage = `We tried reaching you regarding digital solutions for your business.

Please let us know a convenient time to connect so we can understand your requirements and explain the suitable service for your business.`;
    }

    return `Dear Client,

Welcome to Conquest Techno Solutions.

${serviceMessage}

Website:
www.conquesttechnosolutions.com

Instagram:
https://www.instagram.com/innovatewithcts?igsh=MW9xbTY0NHNhdmVudA%3D%3D&utm_source=qr

Google Maps:
https://share.google/Q1Tc2e2nWZLSuhwEP

Regards,
Conquest Techno Solutions`;
  };

  const handleWhatsAppButtonClick = (
    event,
    item
  ) => {
    event.stopPropagation();

    const currentContactNumber =
      contactNumbers[item._id] ||
      item.contactNumber ||
      "";

    const normalizedNumber =
      normalizeWhatsAppNumber(
        currentContactNumber
      );

    if (!normalizedNumber) {
      setMessage(
        "Please enter a valid contact number before opening WhatsApp"
      );

      return;
    }

    setSelectedWhatsAppLead({
      ...item,
      contactNumber:
        currentContactNumber
    });

    setShowWhatsAppPopup(true);
    setMessage("");
  };

  const handleCloseWhatsAppPopup = () => {
    setShowWhatsAppPopup(false);
    setSelectedWhatsAppLead(null);
  };

  const handleOpenWhatsApp = () => {
    if (!selectedWhatsAppLead) {
      return;
    }

    const normalizedNumber =
      normalizeWhatsAppNumber(
        selectedWhatsAppLead.contactNumber
      );

    if (!normalizedNumber) {
      setMessage(
        "Please enter a valid contact number"
      );

      return;
    }

    const whatsAppMessage =
      getWhatsAppMessage();

    const whatsAppUrl =
      `https://wa.me/${normalizedNumber}` +
      `?text=${encodeURIComponent(
        whatsAppMessage
      )}`;

    const openedWindow = window.open(
      whatsAppUrl,
      "_blank"
    );

    if (!openedWindow) {
      setMessage(
        "WhatsApp could not open. Please allow browser popups and try again."
      );

      return;
    }

    openedWindow.opener = null;

    handleCloseWhatsAppPopup();
  };

  const handleIgnoredChange = async (
    item,
    checked
  ) => {
    // When checking No Need,
    // ask for the reason first.
    if (checked) {
      setSelectedIgnoredRecord(item);
      setSelectedIgnoredReason("");
      setShowIgnoredReasonPopup(true);
      setMessage("");
      return;
    }

    // When unchecking No Need,
    // remove the reason also.
    try {
      setSavingIgnoredId(item._id);

      await api.put(
        `/calling-data/${item._id}/ignored`,
        {
          isIgnored: false,
          ignoredReason: ""
        }
      );

      await refreshCallingData();

      setMessage(
        "No Need removed successfully"
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to update calling data"
      );
    } finally {
      setSavingIgnoredId("");
    }
  };

  const handleCloseIgnoredReasonPopup = () => {
    setShowIgnoredReasonPopup(false);
    setSelectedIgnoredRecord(null);
    setSelectedIgnoredReason("");
  };

  const handleConfirmIgnoredReason = async () => {
    if (
      !selectedIgnoredRecord ||
      !selectedIgnoredReason
    ) {
      return;
    }

    try {
      setSavingIgnoredId(
        selectedIgnoredRecord._id
      );

      await api.put(
        `/calling-data/${selectedIgnoredRecord._id}/ignored`,
        {
          isIgnored: true,
          ignoredReason:
            selectedIgnoredReason
        }
      );

      await refreshCallingData();

      setMessage(
        "Calling data marked as No Need"
      );

      handleCloseIgnoredReasonPopup();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to update calling data"
      );
    } finally {
      setSavingIgnoredId("");
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
      "CC",
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

  const noNeedCallingDataCount =
    data.filter(
      (item) => item.isIgnored
    ).length;

  const noContactCount =
    data.filter(
      (item) =>
        item.isIgnored &&
        item.ignoredReason ===
        "NO_CONTACT"
    ).length;

  const repeatedCount =
    data.filter(
      (item) =>
        item.isIgnored &&
        item.ignoredReason ===
        "REPEATED"
    ).length;

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
      "No Need":
        item.isIgnored
          ? "Yes"
          : "No",

      "No Need Reason":
        item.isIgnored
          ? getIgnoredReasonLabel(
            item.ignoredReason
          )
          : "",
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
                className={`week-tab-btn ${Number(selectedWeek) === week ? "active" : ""
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

          <div className="ba-calling-summary-card no-need">
            <span>No Need</span>

            <strong>
              {noNeedCallingDataCount}
            </strong>
          </div>

          <div className="ba-calling-summary-card no-contact">
            <span>No Contact</span>

            <strong>
              {noContactCount}
            </strong>
          </div>

          <div className="ba-calling-summary-card repeated">
            <span>Repeated</span>

            <strong>
              {repeatedCount}
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
                  <th>WhatsApp</th>
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
                    className={`clickable-row ${shouldCallAgain(item) ? "call-again-highlight" : ""
                      }`}
                  >
                    <td
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <div className="ba-no-need-cell">
                        <input
                          type="checkbox"
                          checked={
                            item.isIgnored || false
                          }
                          disabled={
                            savingIgnoredId ===
                            item._id
                          }
                          onChange={(e) =>
                            handleIgnoredChange(
                              item,
                              e.target.checked
                            )
                          }
                        />

                        {item.isIgnored &&
                          item.ignoredReason && (
                            <small className="ba-no-need-reason">
                              {getIgnoredReasonLabel(
                                item.ignoredReason
                              )}
                            </small>
                          )}
                      </div>
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

                    <td
                      className="ba-whatsapp-cell"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <button
                        type="button"
                        className="ba-row-whatsapp-btn"
                        onClick={(event) =>
                          handleWhatsAppButtonClick(
                            event,
                            item
                          )
                        }
                      >
                        WhatsApp
                      </button>
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

      {showIgnoredReasonPopup &&
        selectedIgnoredRecord && (
          <div
            className="ba-no-need-popup-overlay"
            onClick={
              handleCloseIgnoredReasonPopup
            }
          >
            <div
              className="ba-no-need-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h2>
                Select No Need Reason
              </h2>

              <p className="ba-no-need-popup-subtitle">
                Why is this calling data
                not needed?
              </p>

              <div className="ba-no-need-business">
                <span>Business Name</span>

                <strong>
                  {selectedIgnoredRecord.businessName ||
                    "-"}
                </strong>
              </div>

              <div className="ba-no-need-options">
                <label
                  className={`ba-no-need-option ${selectedIgnoredReason ===
                    "NO_CONTACT"
                    ? "selected"
                    : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="ignoredReason"
                    value="NO_CONTACT"
                    checked={
                      selectedIgnoredReason ===
                      "NO_CONTACT"
                    }
                    onChange={(e) =>
                      setSelectedIgnoredReason(
                        e.target.value
                      )
                    }
                  />

                  <span>
                    No Contact
                  </span>
                </label>

                <label
                  className={`ba-no-need-option ${selectedIgnoredReason ===
                    "REPEATED"
                    ? "selected"
                    : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="ignoredReason"
                    value="REPEATED"
                    checked={
                      selectedIgnoredReason ===
                      "REPEATED"
                    }
                    onChange={(e) =>
                      setSelectedIgnoredReason(
                        e.target.value
                      )
                    }
                  />

                  <span>
                    Repeated
                  </span>
                </label>
              </div>

              <div className="ba-no-need-popup-actions">
                <button
                  type="button"
                  className="ba-no-need-cancel-btn"
                  onClick={
                    handleCloseIgnoredReasonPopup
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="ba-no-need-confirm-btn"
                  disabled={
                    !selectedIgnoredReason ||
                    savingIgnoredId ===
                    selectedIgnoredRecord._id
                  }
                  onClick={
                    handleConfirmIgnoredReason
                  }
                >
                  {savingIgnoredId ===
                    selectedIgnoredRecord._id
                    ? "Saving..."
                    : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

      {showWhatsAppPopup &&
        selectedWhatsAppLead && (
          <div
            className="ba-whatsapp-popup-overlay"
            onClick={
              handleCloseWhatsAppPopup
            }
          >
            <div
              className="ba-whatsapp-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="ba-whatsapp-popup-icon">
                WA
              </div>

              <h2>
                Send WhatsApp Message
              </h2>

              <p className="ba-whatsapp-popup-subtitle">
                The message will open pre-filled
                in your WhatsApp account.
              </p>

              <div className="ba-whatsapp-lead-details">
                <div>
                  <span>
                    Business Name
                  </span>

                  <strong>
                    {selectedWhatsAppLead.businessName ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Contact Number
                  </span>

                  <strong>
                    {selectedWhatsAppLead.contactNumber ||
                      "-"}
                  </strong>
                </div>
              </div>

              <div className="ba-whatsapp-message-preview">
                <span>
                  Message Preview
                </span>

                <p>
                  {getWhatsAppMessage()}
                </p>
              </div>

              <div className="ba-whatsapp-popup-actions">
                <button
                  type="button"
                  className="ba-whatsapp-close-btn"
                  onClick={
                    handleCloseWhatsAppPopup
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="ba-whatsapp-open-btn"
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

export default TelecallerCallingDataPage;