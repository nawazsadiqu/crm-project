import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/tmc.css";

const callStatusOptions = [
  "AP",
  "CBA",
  "CBP",
  "CC",
  "NI",
  "CCB",
  "NL",
  "B",
  "NC",
  "S"
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
  CC: "status-cc",
  NI: "status-ni",
  CCB: "status-ccb",
  NL: "status-nl",
  B: "status-b",
  NC: "status-nc",
  S: "status-s"
};

const callStatusLabels = {
  AP: "Appointment",
  CBA: "Call Back for Appointment",
  CBP: "Call Back for Presentation",
  CC: "Cut the Call",
  NI: "Not Interested",
  CCB: "Customer Call Back",
  NL: "Not Lifting",
  B: "Busy",
  NC: "Not Connected",
  S: "Switched Off"
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

  const callingData = location.state?.callingData || null;

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

  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [showPresentationPopup, setShowPresentationPopup] = useState(false);
  const [presentationStatuses, setPresentationStatuses] = useState({});
  const [presentationNotes, setPresentationNotes] = useState({});
  const [tempPresentationNote, setTempPresentationNote] = useState("");

  const [appointmentsVisited, setAppointmentsVisited] = useState(0);
  const [forms, setForms] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [message, setMessage] = useState("");

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

        const statusMap = {};
        const notesMap = {};

        if (data.calls?.length) {
          data.calls.forEach((item) => {
            statusMap[item.callNumber] = item.status;
            notesMap[item.callNumber] = item.notes || "";
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
        setPresentationStatuses(presentationStatusMap);
        setPresentationNotes(presentationNotesMap);
        setAppointmentsVisited(data.appointmentsVisited || 0);
        setForms(data.forms || 0);
        setRevenue(data.revenue || 0);
        setTmcLoaded(true);
      } catch (error) {
        setCallStatuses({});
        setCallNotes({});
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

    const notesText = `Business Name: ${callingData.businessName || "-"}
Map Link: ${callingData.mapLink || "-"}
Contact Number: ${callingData.contactNumber || "-"}

Manual Note: `;

    setSelectedCall(nextCallNumber);
    setTempCallNote(notesText);
    setShowCallPopup(true);
    setHasOpenedCallingData(true);
  }, [callingData, hasOpenedCallingData, tmcLoaded, callStatuses, callNumbers]);

  const handleCallClick = (number) => {
    setSelectedCall(number);
    setTempCallNote(callNotes[number] || "");
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

  const handleSaveTmcData = async (
    updatedPresentationStatuses = presentationStatuses,
    updatedPresentationNotes = presentationNotes,
    updatedCallStatuses = callStatuses,
    updatedCallNotes = callNotes
  ) => {
    const formattedCalls = Object.entries(updatedCallStatuses).map(
      ([callNumber, status]) => ({
        callNumber: Number(callNumber),
        status,
        notes: updatedCallNotes[callNumber] || ""
      })
    );

    const formattedPresentations = Object.entries(updatedPresentationStatuses).map(
      ([presentationNumber, status]) => ({
        presentationNumber: Number(presentationNumber),
        status,
        notes: updatedPresentationNotes[presentationNumber] || ""
      })
    );

    await api.post("/tmc", {
      date: selectedDate,
      calls: formattedCalls,
      presentations: formattedPresentations,
      appointmentsVisited: Number(appointmentsVisited),
      forms: Number(forms),
      revenue: Number(revenue)
    });
  };

  const getManualNoteOnly = (note) => {
    if (!note) return "";

    if (note.includes("Manual Note:")) {
      return note.split("Manual Note:").pop().trim();
    }

    return note.trim();
  };

  const handleCallStatusSelect = async (status) => {
    if (!selectedCall) return;

    const currentCallNumber = selectedCall;
    const currentCallNote = tempCallNote || "";

    const updatedCallStatuses = {
      ...callStatuses,
      [currentCallNumber]: status
    };

    const updatedCallNotes = {
      ...callNotes,
      [currentCallNumber]: currentCallNote
    };

    setCallStatuses(updatedCallStatuses);
    setCallNotes(updatedCallNotes);

    try {
      await handleSaveTmcData(
        presentationStatuses,
        presentationNotes,
        updatedCallStatuses,
        updatedCallNotes
      );

      if (callingData?._id) {
        await api.put(`/calling-data/${callingData._id}/response`, {
        status,
        notes: getManualNoteOnly(currentCallNote),
        callNumber: currentCallNumber,
        date: selectedDate
      });

      setShowCallPopup(false);
      setSelectedCall(null);
      setTempCallNote("");
      setMessage("Call status saved successfully");

      navigate("/ba/calling-data", { replace: true });
      return;
      }
      setShowCallPopup(false);
      setSelectedCall(null);
      setTempCallNote("");
      setMessage("Call status saved automatically");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to auto-save call status"
      );
    }
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
          notes: currentPresentationNote
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
              }}
            />
          </div>
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

            <textarea
              className="notes-box"
              placeholder="Add notes about this call..."
              value={tempCallNote}
              onChange={(e) => setTempCallNote(e.target.value)}
            />

            <button
              className="btn btn-secondary popup-close-btn"
              onClick={handleCloseCallPopup}
            >
              Close
            </button>
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