import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/tmc.css";

const callStatusOptions = [
  "AP",
  "CBA",
  "CBP",
  "CCB",
  "NI",
  "CC",
  "NC",
  "NA",
  "P",
  "CTS_CLIENT"
];

const presentationStatusOptions = [
  "Appointment Fixed",
  "Rejected",
  "CBC",
  "CBA"
];

const statusColors = {
  AP: "status-ap",
  CBA: "status-cba",
  CBP: "status-cbp",
  CCB: "status-ccb",
  NI: "status-ni",
  CC: "status-cc",
  NC: "status-nc",
  NA: "status-na",
  P: "status-p",
  CTS_CLIENT: "status-cts-client"
};

const callStatusLabels = {
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

const presentationColors = {
  "Appointment Fixed": "presentation-appointment-fixed",
  Rejected: "presentation-rejected",
  CBC: "presentation-cbc",
  CBA: "presentation-cba"
};

const TmcPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [manualNotes, setManualNotes] = useState("");
  const callingData = location.state?.callingData || null;
  const returnTo = location.state?.returnTo || "";
const callbackAppointment =
  location.state?.callbackAppointment || null;

  const callbackPresentation =
  location.state?.callbackPresentation || null;

  const [hasOpenedCallingData, setHasOpenedCallingData] = useState(false);
  const [tmcLoaded, setTmcLoaded] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [callStatuses, setCallStatuses] = useState({});
  const [callNotes, setCallNotes] = useState({});
  const [tempCallNote, setTempCallNote] = useState("");

  const [callCallbackDates, setCallCallbackDates] = useState({});
  const [callCallbackTimes, setCallCallbackTimes] = useState({});
  const [pendingCallStatus, setPendingCallStatus] = useState("");
  const [tempCallbackDate, setTempCallbackDate] = useState("");
  const [tempCallbackTime, setTempCallbackTime] = useState("");

  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [showPresentationPopup, setShowPresentationPopup] = useState(false);
  const [presentationStatuses, setPresentationStatuses] = useState({});
  const [presentationNotes, setPresentationNotes] = useState({});
  const [tempPresentationNote, setTempPresentationNote] = useState("");

  const [presentationDone, setPresentationDone] = useState(false);

  const [appointmentsVisited, setAppointmentsVisited] = useState(0);
  const [forms, setForms] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [message, setMessage] = useState("");
  const [callSearchTerm, setCallSearchTerm] = useState("");

  const [
    showWhatsAppPopup,
    setShowWhatsAppPopup
  ] = useState(false);

  const [
    whatsAppContactNumber,
    setWhatsAppContactNumber
  ]   = useState("");

  const [
    whatsAppBusinessName,
    setWhatsAppBusinessName
  ] = useState("");

  const [
    whatsAppStatus,
    setWhatsAppStatus
  ] = useState("");

  const callNumbers = useMemo(
    () => Array.from({ length: 150 }, (_, index) => index + 1),
    []
  );

  const presentationNumbers = useMemo(
    () => Array.from({ length: 40 }, (_, index) => index + 1),
    []
  );

  useEffect(() => {
    const fetchTmcData = async () => {
      try {
        setMessage("");
        setTmcLoaded(false);

        const { data } = await api.get(`/tmc?date=${selectedDate}`);
        setManualNotes(data.manualNotes || "");
        const statusMap = {};
        const notesMap = {};
        const callbackDateMap = {};
        const callbackTimeMap = {};

        if (data.calls?.length) {
          data.calls.forEach((item) => {
            statusMap[item.callNumber] = item.status;
            notesMap[item.callNumber] = item.notes || "";
            callbackDateMap[item.callNumber] = item.callbackDate || "";
            callbackTimeMap[item.callNumber] = item.callbackTime || "";
          });
        }

        const presentationStatusMap = {};
        const presentationNotesMap = {};

        if (data.presentations?.length) {
          data.presentations.forEach((item) => {
            presentationStatusMap[item.presentationNumber] = item.status;
            presentationNotesMap[item.presentationNumber] = item.notes || "";
          });
        }

        setCallStatuses(statusMap);
        setCallNotes(notesMap);
        setCallCallbackDates(callbackDateMap);
        setCallCallbackTimes(callbackTimeMap);
        setPresentationStatuses(presentationStatusMap);
        setPresentationNotes(presentationNotesMap);
        setAppointmentsVisited(data.appointmentsVisited || 0);
        setForms(data.forms || 0);
        setRevenue(data.revenue || 0);
        setTmcLoaded(true);
      } catch (error) {
        setCallStatuses({});
        setCallNotes({});
        setCallCallbackDates({});
        setCallCallbackTimes({});
        setPresentationStatuses({});
        setPresentationNotes({});
        setAppointmentsVisited(0);
        setForms(0);
        setRevenue(0);
        setMessage("Failed to load TMC data");
        setTmcLoaded(true);
      }
    };

    fetchTmcData();
  }, [selectedDate]);

  useEffect(() => {
    if (!callingData || hasOpenedCallingData || !tmcLoaded) return;

    const nextCallNumber = callNumbers.find((num) => !callStatuses[num]);

    if (!nextCallNumber) {
      setMessage("All call numbers are already filled for this date");
      setHasOpenedCallingData(true);
      return;
    }

    const notesText = `Business Name: ${callingData.businessName || ""}
Map Link: ${callingData.mapLink || ""}
Contact Number: ${callingData.contactNumber || ""}

  Manual Note: `;

    setSelectedCall(nextCallNumber);
    setTempCallNote(notesText);
    setShowCallPopup(true);
    setHasOpenedCallingData(true);
  }, [callingData, hasOpenedCallingData, tmcLoaded, callStatuses, callNumbers]);

  useEffect(() => {
  if (
    !callbackAppointment ||
    hasOpenedCallingData ||
    !tmcLoaded
  )
    return;

  const nextCallNumber = callNumbers.find(
    (num) => !callStatuses[num]
  );

  if (!nextCallNumber) {
    setMessage("All call numbers are already filled for this date");
    setHasOpenedCallingData(true);
    return;
  }

  const notesText = `Business Name: ${
  callbackAppointment.businessName || ""
}
Map Link: ${callbackAppointment.mapLink || ""}
Contact Number: ${
  callbackAppointment.contactNumber || ""
}

Manual Note: `;

  setSelectedCall(nextCallNumber);
  setTempCallNote(notesText);
  setShowCallPopup(true);
  setHasOpenedCallingData(true);
}, [
  callbackAppointment,
  hasOpenedCallingData,
  tmcLoaded,
  callStatuses,
  callNumbers,
]);

useEffect(() => {
  if (
    !callbackPresentation ||
    hasOpenedCallingData ||
    !tmcLoaded
  )
    return;

  const nextCallNumber = callNumbers.find(
    (num) => !callStatuses[num]
  );

  if (!nextCallNumber) {
    setMessage("All call numbers are already filled for this date");
    setHasOpenedCallingData(true);
    return;
  }

  const notesText = `Business Name: ${
    callbackPresentation.businessName || ""
  }
Map Link: ${callbackPresentation.mapLink || ""}
Contact Number: ${
    callbackPresentation.contactNumber || ""
  }

Manual Note: `;

  setSelectedCall(nextCallNumber);
  setTempCallNote(notesText);
  setShowCallPopup(true);
  setHasOpenedCallingData(true);
}, [
  callbackPresentation,
  hasOpenedCallingData,
  tmcLoaded,
  callStatuses,
  callNumbers
]);

  const getDefaultCallNoteTemplate = () => {
  return `Business Name: 
Map Link: 
Contact Number: 

Manual Note: `;
};

const handleCallClick = (number) => {
  setSelectedCall(number);

  setTempCallNote(
    callNotes[number] || getDefaultCallNoteTemplate()
  );

  setPendingCallStatus("");
  setTempCallbackDate(callCallbackDates[number] || "");
  setTempCallbackTime(callCallbackTimes[number] || "");

  setShowCallPopup(true);
  setMessage("");
};

  const handleCloseCallPopup = () => {
  if (selectedCall) {
    setCallNotes((prev) => ({
      ...prev,
      [selectedCall]: tempCallNote
    }));
  }

  setShowCallPopup(false);
  setSelectedCall(null);
  setTempCallNote("");
  setPendingCallStatus("");
  setTempCallbackDate("");
  setTempCallbackTime("");

  if (returnTo) {
    navigate(returnTo, { replace: true });
  }
};

  const handlePresentationClick = (number) => {
    setSelectedPresentation(number);
    setTempPresentationNote(presentationNotes[number] || "");
    setShowPresentationPopup(true);
    setMessage("");
  };

  const handleClosePresentationPopup = () => {
    if (selectedPresentation) {
      setPresentationNotes((prev) => ({
        ...prev,
        [selectedPresentation]: tempPresentationNote
      }));
    }

    setShowPresentationPopup(false);
    setSelectedPresentation(null);
    setTempPresentationNote("");
  };

  const getBusinessNameFromNote = (
    note
    ) => {
      const noteText = String(note || "");

      const match = noteText.match(
        /Business Name:\s*([^\n\r]*)/i
      );

      return match
        ? String(match[1] || "").trim()
        : "";
    };

    const getContactNumberFromNote = (
  note
) => {
  const noteText = String(note || "");

  const match = noteText.match(
    /Contact Number:\s*([^\n\r]*)/i
  );

  return match
    ? String(match[1] || "").trim()
    : "";
};

  
  const callSearchResults = useMemo(() => {
  const searchText = String(
    callSearchTerm || ""
  )
    .trim()
    .toLowerCase();

  if (!searchText) {
    return [];
  }

  const searchDigits =
    searchText.replace(/\D/g, "");

  return callNumbers
    .map((callNumber) => {
      const notes =
        callNotes[callNumber] || "";

      const businessName =
        getBusinessNameFromNote(notes);

      const contactNumber =
        getContactNumberFromNote(notes);

      const status =
        callStatuses[callNumber] || "";

      return {
        callNumber,
        businessName,
        contactNumber,
        status
      };
    })
    .filter((item) => {
      const businessName =
        String(
          item.businessName || ""
        ).toLowerCase();

      const contactDigits =
        String(
          item.contactNumber || ""
        ).replace(/\D/g, "");

      const callNumberText =
        String(item.callNumber);

      const businessMatches =
        businessName.includes(
          searchText
        );

      const contactMatches =
        searchDigits.length > 0 &&
        contactDigits.includes(
          searchDigits
        );

      const callNumberMatches =
        callNumberText ===
        searchText;

      return (
        businessMatches ||
        contactMatches ||
        callNumberMatches
      );
    });
}, [
  callSearchTerm,
  callNumbers,
  callNotes,
  callStatuses
]);

const normalizeWhatsAppNumber = (
  number
) => {
  let cleanNumber = String(
    number || ""
  ).replace(/\D/g, "");

  /*
    Convert numbers such as 09876543210
    to 9876543210.
  */
  if (
    cleanNumber.length === 11 &&
    cleanNumber.startsWith("0")
  ) {
    cleanNumber =
      cleanNumber.slice(1);
  }

  /*
    Add India country code for
    normal 10-digit mobile numbers.
  */
  if (cleanNumber.length === 10) {
    return `91${cleanNumber}`;
  }

  return cleanNumber;
};

const getWhatsAppFollowUpMessage = (
  businessName
) => {
  const businessText =
    businessName
      ? ` regarding Google Page Optimization of your business - ${businessName}`
      : "";

  return `Hello, we tried reaching you${businessText} but could not connect.

Please let us know a convenient time to speak with you.

Website   : https://conquesttechnosolutions.com
Instagram : https://www.instagram.com/innovatewithcts?igsh=dnJvaTNwY3hic3Zz
Location  :   https://www.google.com/maps/place/Conquest+Techno+Solutions+-+CTS/@12.994902,77.6854072,189m/data=!3m2!1e3!5s0x3bae1113273f9da9:0xd3f00d2269ce42bf!4m14!1m7!3m6!1s0x3bae11791c1f9317:0xe652b4b4036ccef9!2sRoyal+Enfield+Showroom+-+Sairam+Autocraft!8m2!3d12.9951019!4d77.6849223!16s%2Fg%2F11byyq7yyt!3m5!1s0x3bae1173928c115b:0x4de133d43945d07c!8m2!3d12.9946649!4d77.6853578!16s%2Fg%2F11xtmp8dvs?entry=ttu&g_ep=EgoyMDI2MDcyOS4wIKXMDSoASAFQAw%3D%3D

Regards,
CTS`;
};

const completeCallSaveNavigation = () => {
  if (returnTo) {
    navigate(returnTo, {
      replace: true
    });

    return;
  }

 
  navigate("/ba/calling-data", {
    replace: true
  });
};

const handleSendWhatsAppMessage = () => {
  const normalizedNumber =
    normalizeWhatsAppNumber(
      whatsAppContactNumber
    );

  if (!normalizedNumber) {
    setMessage(
      "A valid contact number is required"
    );

    return;
  }

  const messageText =
    getWhatsAppFollowUpMessage(
      whatsAppBusinessName
    );

  const whatsAppUrl =
    `https://wa.me/${normalizedNumber}` +
    `?text=${encodeURIComponent(
      messageText
    )}`;

  /*
    Open WhatsApp in a separate tab.

    Do not check the returned window value.
    Browsers may return null when noopener
    is used even though the tab opened.
  */
  window.open(
    whatsAppUrl,
    "_blank",
    "noopener,noreferrer"
  );

  /*
    Immediately close the CRM popup and
    return the current CRM tab to Calling Data.
  */
  setShowWhatsAppPopup(false);
  setWhatsAppContactNumber("");
  setWhatsAppBusinessName("");
  setWhatsAppStatus("");

  completeCallSaveNavigation();
};

  const handleSaveTmcData = async (
    updatedPresentationStatuses = presentationStatuses,
    updatedPresentationNotes = presentationNotes,
    updatedCallStatuses = callStatuses,
    updatedCallNotes = callNotes,
    updatedCallCallbackDates = callCallbackDates,
    updatedCallCallbackTimes = callCallbackTimes
  ) => {
    const allowedCallStatuses = [
  "AP",
  "CBA",
  "CBP",
  "CC",
  "NI",
  "CCB",
  "NC",
  "NA",
  "P",
  "CTS_CLIENT"
];

const formattedCalls = Object.entries(updatedCallStatuses)
    .filter(([_, status]) =>allowedCallStatuses.includes(status))
    .map(
      ([callNumber, status]) => {
        const notes =
          updatedCallNotes[
            callNumber
          ] || "";

        return {
          callNumber:
            Number(callNumber),

          businessName:
            getBusinessNameFromNote(
              notes
            ),

          status,

          notes,

          callbackDate:
            status === "CBP"
              ? updatedCallCallbackDates[
                callNumber
              ] || ""
            : "",

          callbackTime:
            status === "CBP"
              ? updatedCallCallbackTimes[
              callNumber
              ] || ""
            : ""
          };
        }
      );

    const formattedPresentations = Object.entries(updatedPresentationStatuses).map(
    ([presentationNumber, status]) => {
      const notes =
        updatedPresentationNotes[
          presentationNumber
        ] || "";

      return {
        presentationNumber:
          Number(presentationNumber),

        businessName:
          getBusinessNameFromNote(
            notes
          ),

        status,

        notes
      };
    }
  );

    await api.post("/tmc", {
      date: selectedDate,
      calls: formattedCalls,
      presentations: formattedPresentations,
      appointmentsVisited: Number(appointmentsVisited),
      forms: Number(forms),
      revenue: Number(revenue),
      manualNotes
    });
  };

  const getManualNoteOnly = (note) => {
    if (!note) return "";

    if (note.includes("Manual Note:")) {
      return note.split("Manual Note:").pop().trim();
    }

    return note.trim();
  };

  const saveSelectedCallStatus = async (
  status,
  callbackDate = "",
  callbackTime = ""
) => {
  if (!selectedCall) return;

  const currentCallNumber = selectedCall;
  const currentCallNote = tempCallNote || "";

  const currentBusinessName =
  getBusinessNameFromNote(
    currentCallNote
  ) ||
  callingData?.businessName ||
  callbackAppointment?.businessName ||
  callbackPresentation?.businessName ||
  "";

const currentContactNumber =
  getContactNumberFromNote(
    currentCallNote
  ) ||
  callingData?.contactNumber ||
  callbackAppointment?.contactNumber ||
  callbackPresentation?.contactNumber ||
  "";

  if (
  (status === "NC" ||
    status === "NA") &&
  !normalizeWhatsAppNumber(
    currentContactNumber
  )
) {
  setMessage(
    "A valid contact number is required before selecting Not Connected or Not Answered"
  );

  return;
}

  const updatedCallStatuses = {
    ...callStatuses,
    [currentCallNumber]: status
  };

  const updatedCallNotes = {
    ...callNotes,
    [currentCallNumber]: currentCallNote
  };

  const updatedCallCallbackDates = {
    ...callCallbackDates,
    [currentCallNumber]:
      status === "CBP" ? callbackDate : ""
  };

  const updatedCallCallbackTimes = {
  ...callCallbackTimes,

  [currentCallNumber]:
    status === "CBP"
      ? callbackTime
      : ""
};

  setCallStatuses(updatedCallStatuses);
  setCallNotes(updatedCallNotes);
  setCallCallbackDates(updatedCallCallbackDates);

  setCallCallbackTimes(
  updatedCallCallbackTimes
);

  try {
    await handleSaveTmcData(
      presentationStatuses,
      presentationNotes,
      updatedCallStatuses,
      updatedCallNotes,
      updatedCallCallbackDates,
      updatedCallCallbackTimes
    );

    if (callingData?._id) {
      await api.put(`/calling-data/${callingData._id}/response`, {
        status,
        notes: getManualNoteOnly(currentCallNote),
        callNumber: currentCallNumber,
        date: selectedDate
      });
    }

    setShowCallPopup(false);
    setSelectedCall(null);
    setPendingCallStatus("");
    setTempCallbackDate("");
    setTempCallbackTime("");

    if (presentationDone) {
      const nextPresentation = presentationNumbers.find(
        (num) => !presentationStatuses[num]
      );

      if (nextPresentation) {
        const businessDetails = currentCallNote.includes("Business Name:")
          ? currentCallNote
          : `Business Name: ${callingData?.businessName || ""}
Map Link: ${callingData?.mapLink || ""}
Contact Number: ${callingData?.contactNumber || ""}

Manual Note: ${getManualNoteOnly(currentCallNote)}`;

        setSelectedPresentation(nextPresentation);
        setTempPresentationNote(businessDetails);
        setShowPresentationPopup(true);
        setTempCallNote("");
        setPresentationDone(false);
        setMessage("Call saved. Now update presentation status.");
        return;
      }
    }

    setTempCallNote("");
setPresentationDone(false);

setMessage(
  status === "CBP"
    ? "Callback presentation date saved successfully"
    : "Call status saved successfully"
);

/*
  After Not Connected or Not Answered,
  show the WhatsApp follow-up popup.
*/
if (
  status === "NC" ||
  status === "NA"
) {
  setWhatsAppContactNumber(
    currentContactNumber
  );

  setWhatsAppBusinessName(
    currentBusinessName
  );

  setWhatsAppStatus(status);

  setShowWhatsAppPopup(true);

  return;
}

completeCallSaveNavigation();
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Failed to auto-save call status"
    );
  }
};

const handleCallStatusSelect = async (status) => {
  if (!selectedCall) return;

  if (status === "CBP") {
    setPendingCallStatus("CBP");
    setTempCallbackDate(
      callCallbackDates[selectedCall] || ""
    );
    setTempCallbackTime(
  callCallbackTimes[
    selectedCall
  ] || ""
);
    setMessage("");
    return;
  }

  await saveSelectedCallStatus(status);
};

const handleSaveCallbackPresentation = async () => {
    if (!tempCallbackDate) {
      setMessage(
        "Please select the callback presentation date"
      );

      return;
    }

    if (!tempCallbackTime) {
      setMessage(
        "Please select the callback presentation time"
      );

      return;
    }

    await saveSelectedCallStatus(
      "CBP",
      tempCallbackDate,
      tempCallbackTime
    );
  };
  const handlePresentationStatusSelect = async (status) => {
    if (!selectedPresentation) return;

    const currentPresentationNumber = selectedPresentation;
    const currentPresentationNote = tempPresentationNote || "";

    const updatedStatuses = {
      ...presentationStatuses,
      [currentPresentationNumber]: status
    };

    const updatedNotes = {
      ...presentationNotes,
      [currentPresentationNumber]: currentPresentationNote
    };

    setPresentationStatuses(updatedStatuses);
    setPresentationNotes(updatedNotes);

    try {
      await handleSaveTmcData(updatedStatuses, updatedNotes);

      setShowPresentationPopup(false);
      setSelectedPresentation(null);
      setTempPresentationNote("");
      setMessage("Presentation status saved successfully");

      navigate("/ba/data-sheet/presentation-details", {
        state: {
        date: selectedDate,
        presentationNumber: currentPresentationNumber,
        status,
        notes: currentPresentationNote,
        returnTo
      }
    });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to save presentation status"
      );
    }
  };

  const handleSave = async () => {
    try {
      await handleSaveTmcData();
      setMessage(`TMC data saved successfully for ${selectedDate}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save TMC data");
    }
  };

  return (
    <div className="tmc-layout-page">
      <div className="tmc-container">
        <div className="tmc-header">
          <div>
            <h1>TMC Call Tracking</h1>
            <p className="tmc-subtitle">
              Track calls and presentations. Summary is available in Goals page.
            </p>
          </div>

          <div className="tmc-date-box">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setHasOpenedCallingData(false);
                setCallSearchTerm("");
              }}
            />
          </div>
        </div>

        <div className="tmc-call-search-section">
  <div className="tmc-call-search-header">
    <div>
      <h3>Search Saved Calls</h3>

      <p>
        Search by business name,
        contact number or call number
      </p>
    </div>

    {callSearchTerm && (
      <button
        type="button"
        className="tmc-search-clear-btn"
        onClick={() =>
          setCallSearchTerm("")
        }
      >
        Clear
      </button>
    )}
  </div>

  <input
    type="text"
    className="tmc-call-search-input"
    value={callSearchTerm}
    onChange={(event) =>
      setCallSearchTerm(
        event.target.value
      )
    }
    placeholder="Search business name or contact number..."
  />

  {callSearchTerm.trim() && (
    <div className="tmc-call-search-results">
      {callSearchResults.length === 0 ? (
        <p className="tmc-search-empty">
          No matching saved call found
          for {selectedDate}.
        </p>
      ) : (
        callSearchResults.map(
          (item) => (
            <button
              type="button"
              key={item.callNumber}
              className="tmc-search-result-item"
              onClick={() => {
                handleCallClick(
                  item.callNumber
                );

                setCallSearchTerm("");
              }}
            >
              <div className="tmc-search-result-call">
                Call {item.callNumber}
              </div>

              <div className="tmc-search-result-details">
                <strong>
                  {item.businessName ||
                    "Business name not entered"}
                </strong>

                <span>
                  {item.contactNumber ||
                    "Contact number not entered"}
                </span>
              </div>

              <div className="tmc-search-result-status">
                {callStatusLabels[
                  item.status
                ] ||
                  item.status ||
                  "No Status"}
              </div>
            </button>
          )
        )
      )}
    </div>
  )}
</div>

        <div className="tmc-main-grid">
          <div className="tmc-calls-card">
            <div className="tmc-section-header">
              <h2>Calls</h2>
              <p>Select a call number to update its status</p>
            </div>

            <div className="grid-calls">
              {callNumbers.map((num) => {
                const status = callStatuses[num];
                const colorClass = status ? statusColors[status] : "";

                return (
                  <button
                    key={num}
                    className={`call-box ${colorClass}`}
                    onClick={() => handleCallClick(num)}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tmc-right-section">
            <div className="presentation-card">
              <div className="tmc-section-header">
                <h2>Completed Presentations</h2>
                <p>Track status for presentation slots</p>
              </div>

              <div className="presentation-grid">
                {presentationNumbers.map((num) => {
                  const status = presentationStatuses[num];
                  const colorClass = status ? presentationColors[status] : "";

                  return (
                    <button
                      key={num}
                      className={`presentation-box ${colorClass}`}
                      onClick={() => handlePresentationClick(num)}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <div className="tmc-manual-notes">
  <h3>Notes</h3>
  <textarea
    placeholder="Add any manual notes for today..."
    value={manualNotes}
    onChange={(e) => setManualNotes(e.target.value)}
  />
</div>
            </div>
          </div>
        </div>

        <div className="tmc-bottom-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>

          <Link to="/ba" className="btn btn-secondary">
            Back
          </Link>

          {message && <p className="tmc-message">{message}</p>}
        </div>
      </div>

      {showCallPopup && (
  <div className="popup-overlay" onClick={handleCloseCallPopup}>
    <div className="status-popup" onClick={(e) => e.stopPropagation()}>
      <h2>Select Status for Call {selectedCall}</h2>

      <div className="call-popup-top-actions">
  <label className="presentation-done-check">
    <input
      type="checkbox"
      checked={presentationDone}
      onChange={(e) => setPresentationDone(e.target.checked)}
    />
    <span>Presentation Done</span>
  </label>

  <button
    type="button"
    className="btn-unselect"
    onClick={() => {
      if (!selectedCall) return;

      const updatedStatuses = { ...callStatuses };
      const updatedNotes = { ...callNotes };
      const updatedCallbackDates = { ...callCallbackDates };
      const updatedCallbackTimes = { ...callCallbackTimes };

      delete updatedStatuses[selectedCall];
      delete updatedNotes[selectedCall];
      delete updatedCallbackDates[selectedCall];
      delete updatedCallbackTimes[selectedCall];

      setCallStatuses(updatedStatuses);
      setCallNotes(updatedNotes);
      setCallCallbackDates(updatedCallbackDates);
      setCallCallbackTimes(updatedCallbackTimes);
      setTempCallNote("");
      setShowCallPopup(false);
      setSelectedCall(null);
      setMessage("Call status unselected");
      setPendingCallStatus("");
      setTempCallbackDate("");
      setTempCallbackTime("");
    }}
  >
    Unselect
  </button>

  <button
    type="button"
    className="btn-close-popup"
    onClick={handleCloseCallPopup}
  >
    Close
  </button>
</div>

<div className="popup-status-grid">
  {callStatusOptions.map((status) => (
    <button
      key={status}
      className={`popup-status-btn ${statusColors[status]}`}
      onClick={() => handleCallStatusSelect(status)}
    >
      {callStatusLabels[status] || status}
    </button>
  ))}
</div>

{pendingCallStatus === "CBP" && (
  <div className="cbp-callback-date-box">
    <div className="cbp-date-time-grid">
      <div>
        <label htmlFor="cbp-callback-date">
          Callback Presentation Date
        </label>

        <input
          id="cbp-callback-date"
          type="date"
          value={tempCallbackDate}
          min={selectedDate}
          onChange={(event) =>
            setTempCallbackDate(
              event.target.value
            )
          }
        />
      </div>

      <div>
        <label htmlFor="cbp-callback-time">
          Callback Presentation Time
        </label>

        <input
          id="cbp-callback-time"
          type="time"
          value={tempCallbackTime}
          onChange={(event) =>
            setTempCallbackTime(
              event.target.value
            )
          }
        />
      </div>
    </div>

    <button
      type="button"
      className="btn btn-primary"
      onClick={
        handleSaveCallbackPresentation
      }
    >
      Save Callback Presentation
    </button>
  </div>
)}

<textarea
  className="notes-box"
  placeholder="Add notes about this call..."
  value={tempCallNote}
  onChange={(e) => setTempCallNote(e.target.value)}
/>

      {/* <div className="call-popup-footer">
        <label className="presentation-done-check">
          <input
            type="checkbox"
            checked={presentationDone}
            onChange={(e) => setPresentationDone(e.target.checked)}
          />
          <span>Presentation Done</span>
        </label>

        <button
          type="button"
          className="btn-unselect"
          onClick={() => {
            if (!selectedCall) return;

            const updatedStatuses = { ...callStatuses };
            const updatedNotes = { ...callNotes };

            delete updatedStatuses[selectedCall];
            delete updatedNotes[selectedCall];

            setCallStatuses(updatedStatuses);
            setCallNotes(updatedNotes);
            setTempCallNote("");
            setShowCallPopup(false);
            setSelectedCall(null);
            setMessage("Call status unselected");
          }}
        >
          Unselect
        </button>

        <button
          type="button"
          className="btn-close-popup"
          onClick={handleCloseCallPopup}
        >
          Close
        </button>
      </div> */}
    </div>
  </div>
)}
{showWhatsAppPopup && (
  <div className="popup-overlay whatsapp-popup-overlay">
    <div
      className="whatsapp-followup-popup"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="whatsapp-popup-icon">
        WA
      </div>

      <h2>
        Send WhatsApp Message
      </h2>

      <p className="whatsapp-popup-subtitle">
  Call saved as{" "}
  <strong>
    {callStatusLabels[
      whatsAppStatus
    ] || whatsAppStatus}
  </strong>
  . You must open the WhatsApp
  follow-up before continuing.
</p>

      <div className="whatsapp-customer-details">
        <div>
          <span>Business</span>

          <strong>
            {whatsAppBusinessName ||
              "-"}
          </strong>
        </div>

        <div>
          <span>Contact Number</span>

          <strong>
            {whatsAppContactNumber ||
              "Not available"}
          </strong>
        </div>
      </div>

      <div className="whatsapp-message-preview">
        <span>Message Preview</span>

        <p>
          {getWhatsAppFollowUpMessage(
            whatsAppBusinessName
          )}
        </p>
      </div>

      {!normalizeWhatsAppNumber(
        whatsAppContactNumber
      ) && (
        <p className="whatsapp-number-warning">
          A valid contact number is
          required to open WhatsApp.
        </p>
      )}

      <div className="whatsapp-popup-actions">
  <button
    type="button"
    className="whatsapp-send-btn"
    onClick={
      handleSendWhatsAppMessage
    }
    disabled={
      !normalizeWhatsAppNumber(
        whatsAppContactNumber
      )
    }
  >
    Open WhatsApp & Continue
  </button>
</div>
    </div>
  </div>
)}

      {showPresentationPopup && (
        <div className="popup-overlay" onClick={handleClosePresentationPopup}>
          <div className="status-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Select Status for Presentation {selectedPresentation}</h2>

            <div className="popup-status-grid">
              {presentationStatusOptions.map((status) => (
                <button
                  key={status}
                  className={`popup-status-btn ${presentationColors[status]}`}
                  onClick={() => handlePresentationStatusSelect(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <textarea
              className="notes-box"
              placeholder="Add notes about this presentation..."
              value={tempPresentationNote}
              onChange={(e) => setTempPresentationNote(e.target.value)}
            />

            <button
              className="btn btn-secondary popup-close-btn"
              onClick={handleClosePresentationPopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TmcPage;