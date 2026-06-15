import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "../css/hrTmc.css";

const statusColors = {
  INTERESTED: "status-interested",
  NOT_INTERESTED: "status-not-interested",
  NOT_SELECTED: "status-not-selected",
  CALL_BACK: "status-call-back",
  NOT_LIFTING: "status-not-lifting",
  NOT_CONNECTED: "status-not-connected",
};

const statusLabels = {
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not Interested",
  NOT_SELECTED: "Not Selected",
  CALL_BACK: "Call Back",
  NOT_LIFTING: "Not Lifting",
  NOT_CONNECTED: "Not Connected",
};

const allStatuses = [
  "INTERESTED",
  "NOT_INTERESTED",
  "NOT_SELECTED",
  "CALL_BACK",
  "NOT_LIFTING",
  "NOT_CONNECTED",
];

const HrTmcPage = () => {
  const [searchParams] = useSearchParams();
  const callingDataId = searchParams.get("callingDataId");

  const navigate = useNavigate();
const returnTab = searchParams.get("returnTab") || "1";

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallPopup, setShowCallPopup] = useState(false);

  const [callStatuses, setCallStatuses] = useState({});
  const [callNotes, setCallNotes] = useState({});
  const [tempCallNote, setTempCallNote] = useState("");

  const [candidateData, setCandidateData] = useState(null);

  const [candidateDetails, setCandidateDetails] = useState({
    candidateName: "",
    contactNumber: "",
    qualification: "",
    location: "",
    experience: "",
  });

  const [message, setMessage] = useState("");

  const callNumbers = useMemo(
    () => Array.from({ length: 150 }, (_, i) => i + 1),
    []
  );

  const fetchHrCalls = async () => {
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
    } catch (error) {
      console.error("Failed to fetch HR calls", error);
      setCallStatuses({});
      setCallNotes({});
    }
  };

  const fetchCandidateData = async () => {
    if (!callingDataId) return;

    try {
      const { data } = await api.get(`/hr-calling-data/${callingDataId}`);

      setCandidateData(data);

      setCandidateDetails({
        candidateName: data.candidateName || "",
        contactNumber: data.contactNumber || "",
        qualification: data.qualification || "",
        location: data.location || "",
        experience: data.experience || "",
      });
    } catch (error) {
      console.error("Failed to fetch candidate data", error);
    }
  };

  useEffect(() => {
    fetchHrCalls();
  }, [selectedDate]);

  useEffect(() => {
    fetchCandidateData();
  }, [callingDataId]);

  const getNextEmptyCallNumber = () => {
    for (let num of callNumbers) {
      if (!callStatuses[num]) return num;
    }
    return 1;
  };

  useEffect(() => {
    if (callingDataId) {
      const nextCall = getNextEmptyCallNumber();
      setSelectedCall(nextCall);
      setTempCallNote(callNotes[nextCall] || "");
      setShowCallPopup(true);
    }
  }, [callingDataId, callStatuses]);

  const handleCallClick = (num) => {
    setSelectedCall(num);
    setTempCallNote(callNotes[num] || "");
    setShowCallPopup(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setCandidateDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResponseClick = async (status) => {
    try {
      if (!selectedCall) {
        alert("Please select call number");
        return;
      }

      const updatedStatuses = {
        ...callStatuses,
        [selectedCall]: status,
      };

      const updatedNotes = {
        ...callNotes,
        [selectedCall]: tempCallNote,
      };

      setCallStatuses(updatedStatuses);
      setCallNotes(updatedNotes);

      const formattedCalls = Object.entries(updatedStatuses).map(
        ([num, callStatus]) => ({
          callNumber: Number(num),
          status: callStatus,
          notes: updatedNotes[num] || "",
        })
      );

      await api.post("/hr-calls", {
        date: selectedDate,
        calls: formattedCalls,
      });

      if (callingDataId) {
        await api.patch(`/hr-calling-data/${callingDataId}/call-response`, {
          candidateName: candidateDetails.candidateName,
          contactNumber: candidateDetails.contactNumber,
          qualification: candidateDetails.qualification,
          location: candidateDetails.location,
          experience: candidateDetails.experience,
          response: statusLabels[status],
          responseCode: status,
          notes: tempCallNote,
          callNumber: selectedCall,
          date: selectedDate,
        });

        await fetchCandidateData();
        navigate(`/hr/calling-data?tab=${returnTab}`);
      }

      setMessage("Saved successfully");
      setShowCallPopup(false);
    } catch (error) {
      console.error("Failed to save HR response", error);
      alert("Failed to save HR response");
    }
  };

  return (
    <div className="hr-container">
      <h1>HR Call Tracking</h1>

      {candidateData && (
        <div className="hr-candidate-card">
          <h3>Selected Candidate</h3>
          <p>
            <b>Name:</b> {candidateData.candidateName || "-"}
          </p>
          <p>
            <b>Contact:</b> {candidateData.contactNumber || "-"}
          </p>
          <p>
            <b>Qualification:</b> {candidateData.qualification || "-"}
          </p>
          <p>
            <b>Location:</b> {candidateData.location || "-"}
          </p>
          <p>
            <b>Experience:</b> {candidateData.experience || "-"}
          </p>
          <p>
            <b>Last Response:</b>{" "}
            {candidateData.response5 || candidateData.lastResponse || "-"}
          </p>
        </div>
      )}

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

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

      <Link to="/hr">Back</Link>

      {message && <p>{message}</p>}

      {showCallPopup && (
        <>
          <div
            className="popup-overlay"
            onClick={() => setShowCallPopup(false)}
          />

          <div className="popup">
            <h3>Call {selectedCall}</h3>

            {callStatuses[selectedCall] && (
              <p style={{ fontSize: "13px", marginBottom: "10px" }}>
                Selected: <b>{statusLabels[callStatuses[selectedCall]]}</b>
              </p>
            )}

            <div className="candidate-details-box">
              <input
                name="candidateName"
                placeholder="Candidate Name"
                value={candidateDetails.candidateName}
                onChange={handleInputChange}
              />

              <input
                name="contactNumber"
                placeholder="Contact Number"
                value={candidateDetails.contactNumber}
                onChange={handleInputChange}
              />

              <input
                name="qualification"
                placeholder="Qualification"
                value={candidateDetails.qualification}
                onChange={handleInputChange}
              />

              <input
                name="location"
                placeholder="Location"
                value={candidateDetails.location}
                onChange={handleInputChange}
              />

              <input
                name="experience"
                placeholder="Experience"
                value={candidateDetails.experience}
                onChange={handleInputChange}
              />
            </div>

            <textarea
              placeholder="Add comment..."
              value={tempCallNote}
              onChange={(e) => setTempCallNote(e.target.value)}
            />

            <div className="popup-status-grid">
              {allStatuses.map((code) => (
                <button
                  key={code}
                  className={`popup-status-btn ${statusColors[code]}`}
                  onClick={() => handleResponseClick(code)}
                  title={statusLabels[code]}
                >
                  {statusLabels[code]}
                </button>
              ))}
            </div>

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