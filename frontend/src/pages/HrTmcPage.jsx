import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrTmc.css";

const statusColors = {
  NL: "status-nl",
  NL_CC: "status-nl_cc",
  NL_NC: "status-nl_nc",
  B: "status-b",
  CC: "status-cc",

  ANS_RS: "status-ans_rs",
  ANS_CC: "status-ans_cc",
  ANS_NI: "status-ans_ni",

  ANS_NW: "status-ans_nw",
  ANS_NM: "status-ans_nm",

  ANS_CB: "status-ans_cb",
  ANS_NS: "status-ans_ns"
};

const statusLabels = {
  NL: "Not Lifting",
  NL_CC: "Not Lifting & Cut",
  NL_NC: "Not Lifting & Not Connected",
  B: "Busy",
  CC: "Cut the Call",

  ANS_RS: "Resume Shared",
  ANS_CC: "Answered & Cut",
  ANS_NI: "Not Interested",
  ANS_CB: "Callback",
  ANS_NS: "Not Selected",

  ANS_NW: "Next Week",
  ANS_NM: "Next Month"
};

const allStatuses = [
  "NL",
  "NL_CC",
  "NL_NC",
  "B",
  "CC",
  "ANS_RS",
  "ANS_CC",
  "ANS_NI",
  "ANS_CB",
  "ANS_NS",
  "ANS_NW",
  "ANS_NM"
];

const HrTmcPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [callStatuses, setCallStatuses] = useState({});
  const [callNotes, setCallNotes] = useState({});
  const [tempCallNote, setTempCallNote] = useState("");
  const [message, setMessage] = useState("");

  const callNumbers = useMemo(
    () => Array.from({ length: 150 }, (_, i) => i + 1),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/hr-calls?date=${selectedDate}`);

        const statusMap = {};
        const notesMap = {};

        data.calls?.forEach((c) => {
          statusMap[c.callNumber] = c.status;
          notesMap[c.callNumber] = c.notes || "";
        });

        setCallStatuses(statusMap);
        setCallNotes(notesMap);
      } catch {
        setCallStatuses({});
        setCallNotes({});
      }
    };

    fetchData();
  }, [selectedDate]);

  const handleCallClick = (num) => {
    setSelectedCall(num);
    setTempCallNote(callNotes[num] || "");
    setShowCallPopup(true);
  };

  const handleSelect = (status) => {
    setCallStatuses((prev) => ({ ...prev, [selectedCall]: status }));
    setCallNotes((prev) => ({ ...prev, [selectedCall]: tempCallNote }));
    setShowCallPopup(false);
  };

  const handleSave = async () => {
    const formattedCalls = Object.entries(callStatuses).map(
      ([num, status]) => ({
        callNumber: Number(num),
        status,
        notes: callNotes[num] || ""
      })
    );

    await api.post("/hr-calls", {
      date: selectedDate,
      calls: formattedCalls
    });

    setMessage("Saved successfully");
  };

  return (
    <div className="hr-container">
      <h1>HR Call Tracking</h1>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      {/* CALL GRID */}
      <div className="grid">
        {callNumbers.map((num) => (
          <button
            key={num}
            className={`box ${statusColors[callStatuses[num]] || ""}`}
            onClick={() => handleCallClick(num)}
          >
            {num}
          </button>
        ))}
      </div>

      {/* ACTIONS */}
      <button onClick={handleSave}>Save</button>
      <Link to="/hr">Back</Link>
      {message && <p>{message}</p>}

      {/* POPUP */}
      {showCallPopup && (
        <>
          {/* OVERLAY */}
          <div
            className="popup-overlay"
            onClick={() => setShowCallPopup(false)}
          />

          <div className="popup">
            <h3>Call {selectedCall}</h3>

            {/* SELECTED STATUS */}
            {callStatuses[selectedCall] && (
              <p style={{ fontSize: "13px", marginBottom: "10px" }}>
                Selected:{" "}
                <b>{statusLabels[callStatuses[selectedCall]]}</b>
              </p>
            )}

            {/* ALL STATUS OPTIONS */}
            <div className="popup-status-grid">
              {allStatuses.map((code) => (
                <button
                  key={code}
                  className={`popup-status-btn ${statusColors[code]}`}
                  onClick={() => handleSelect(code)}
                  title={statusLabels[code]}
                >
                  {code}
                </button>
              ))}
            </div>

            {/* NOTES */}
            <textarea
              placeholder="Add notes..."
              value={tempCallNote}
              onChange={(e) => setTempCallNote(e.target.value)}
            />

            {/* CLOSE */}
            <button
              style={{ marginTop: "10px", width: "100%" }}
              onClick={() => setShowCallPopup(false)}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HrTmcPage;