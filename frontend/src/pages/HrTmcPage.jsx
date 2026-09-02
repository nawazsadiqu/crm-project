import {useEffect, useMemo, useRef, useState,} from "react";
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

const getTodayLocal = () => {
  const now = new Date();

  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().split("T")[0];
};

const HrTmcPage = () => {
  const [searchParams] = useSearchParams();

  const callingDataId = searchParams.get("callingDataId");
  const returnPage = searchParams.get("returnPage") || "calling-data";
  const returnTab = searchParams.get("returnTab") || "1";

  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(
  () => getTodayLocal()
);

  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallPopup, setShowCallPopup] = useState(false);

  const [callStatuses, setCallStatuses] = useState({});
  const [callNotes, setCallNotes] = useState({});
  const [callCandidateDetails, setCallCandidateDetails] = useState({});
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
  const [callsLoaded, setCallsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [candidateLoaded, setCandidateLoaded] =
  useState(!callingDataId);

const [candidateLoadError, setCandidateLoadError] =
  useState("");

const savingRef = useRef(false);
const callsRequestIdRef = useRef(0);
const candidateRequestIdRef = useRef(0);

  const callNumbers = useMemo(
    () => Array.from({ length: 150 }, (_, i) => i + 1),
    []
  );

  const fetchHrCalls = async () => {
  const requestId = ++callsRequestIdRef.current;

  setCallsLoaded(false);
  setMessage("");
  setShowCallPopup(false);
  setSelectedCall(null);
  setTempCallNote("");
  setCallStatuses({});
  setCallNotes({});
  setCallCandidateDetails({});

  try {
    const { data } = await api.get(
      `/hr-calls?date=${selectedDate}`
    );

    /*
     * Ignore an old request if the date changed
     * before that request completed.
     */
    if (requestId !== callsRequestIdRef.current) {
      return;
    }

    const statusMap = {};
const notesMap = {};
const candidateMap = {};

data.calls?.forEach((call) => {
  statusMap[call.callNumber] =
    call.status;

  notesMap[call.callNumber] =
    call.notes || "";

  candidateMap[call.callNumber] = {
    callingDataId:
      call.callingDataId || "",

    candidateName:
      call.candidateName || "",

    contactNumber:
      call.contactNumber || "",

    qualification:
      call.qualification || "",

    location:
      call.location || "",

    experience:
      call.experience || "",
  };
});

setCallStatuses(statusMap);
setCallNotes(notesMap);
setCallCandidateDetails(
  candidateMap
);
    setCallsLoaded(true);
  } catch (error) {
    if (requestId !== callsRequestIdRef.current) {
      return;
    }

    console.error("Failed to fetch HR calls", error);

    setMessage(
      "Previous calls could not be loaded. " +
        "Saving is disabled to protect existing calls."
    );
  }
};

  const fetchCandidateData = async () => {
  const requestId = ++candidateRequestIdRef.current;

  if (!callingDataId) {
    setCandidateLoaded(true);
    setCandidateLoadError("");
    setCandidateData(null);
    return;
  }

  setCandidateLoaded(false);
  setCandidateLoadError("");
  setCandidateData(null);

  try {
    const { data } = await api.get(
      `/hr-calling-data/${callingDataId}`
    );

    if (
      requestId !== candidateRequestIdRef.current
    ) {
      return;
    }

    setCandidateData(data);

    setCandidateDetails({
      candidateName: data.candidateName || "",
      contactNumber: data.contactNumber || "",
      qualification: data.qualification || "",
      location: data.location || "",
      experience: data.experience || "",
    });

    setCandidateLoaded(true);
  } catch (error) {
    if (
      requestId !== candidateRequestIdRef.current
    ) {
      return;
    }

    console.error(
      "Failed to fetch candidate data",
      error
    );

    setCandidateLoadError(
      "Candidate details could not be loaded. " +
        "Saving is disabled to protect the candidate data."
    );
  }
};

  useEffect(() => {
    fetchHrCalls();
  }, [selectedDate]);

  useEffect(() => {
    fetchCandidateData();
  }, [callingDataId]);

  const getNextEmptyCallNumber = () => {
    for (const num of callNumbers) {
    if (!callStatuses[num]) {
      return num;
    }
  }

  return null;
};

  useEffect(() => {
  /*
   * Do not calculate the next call number until
   * the existing call log has loaded successfully.
   */
  if (
  !callingDataId ||
  !callsLoaded ||
  !candidateLoaded
) {
  return;
}

  const nextCall = getNextEmptyCallNumber();

if (!nextCall) {
  setMessage(
    "All 150 call slots are already completed for this date."
  );
  setShowCallPopup(false);
  return;
}

setSelectedCall(nextCall);
setTempCallNote(callNotes[nextCall] || "");
setShowCallPopup(true);
}, [
  callingDataId,
  callsLoaded,
  candidateLoaded,
]);

  const handleCallClick = (num) => {
  if (!callsLoaded) {
    alert(
      "Please wait until the previous calls are loaded."
    );

    return;
  }

  if (isSaving) {
    return;
  }

  /*
   * If this page was opened manually,
   * restore the candidate details stored
   * against this particular call box.
   */
  if (!callingDataId) {
    const savedCandidate =
      callCandidateDetails[num];

    setCandidateDetails({
      candidateName:
        savedCandidate?.candidateName ||
        "",

      contactNumber:
        savedCandidate?.contactNumber ||
        "",

      qualification:
        savedCandidate?.qualification ||
        "",

      location:
        savedCandidate?.location ||
        "",

      experience:
        savedCandidate?.experience ||
        "",
    });
  }

  setSelectedCall(num);

  setTempCallNote(
    callNotes[num] || ""
  );

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
  if (!callsLoaded) {
    alert(
      "Previous calls have not loaded. " +
        "Please wait and try again."
    );
    return;
  }

  if (callingDataId && !candidateLoaded) {
  alert(
    "Candidate details have not loaded. " +
      "Please wait and try again."
  );
  return;
}

  if (!selectedCall) {
    alert("Please select call number");
    return;
  }

  if (savingRef.current) {
  return;
}

savingRef.current = true;
setIsSaving(true);
setMessage("");

  try {
    /*
     * Send only the selected call.
     * Never send the complete frontend calls array.
     */
    const { data: saveResponse } = await api.post(
      "/hr-calls",
      {
        date: selectedDate,
        call: {
  callNumber:
    selectedCall,

  status,

  notes:
    tempCallNote,

  callingDataId:
    callingDataId ||
    callCandidateDetails[
      selectedCall
    ]?.callingDataId ||
    null,

  candidateName:
    candidateDetails.candidateName,

  contactNumber:
    candidateDetails.contactNumber,

  qualification:
    candidateDetails.qualification,

  location:
    candidateDetails.location,

  experience:
    candidateDetails.experience,
},
      }
    );

    /*
     * Replace frontend state with the authoritative
     * call list returned by MongoDB.
     */
    const savedCalls =
      saveResponse?.data?.calls || [];

    const statusMap = {};
    const notesMap = {};
    const candidateMap = {};

    savedCalls.forEach((savedCall) => {
  statusMap[savedCall.callNumber] =
    savedCall.status;

  notesMap[savedCall.callNumber] =
    savedCall.notes || "";

  candidateMap[
    savedCall.callNumber
  ] = {
    callingDataId:
      savedCall.callingDataId ||
      "",

    candidateName:
      savedCall.candidateName ||
      "",

    contactNumber:
      savedCall.contactNumber ||
      "",

    qualification:
      savedCall.qualification ||
      "",

    location:
      savedCall.location ||
      "",

    experience:
      savedCall.experience ||
      "",
  };
});

    setCallStatuses(statusMap);
    setCallNotes(notesMap);
    setCallCandidateDetails(candidateMap);

    const candidateResponsePayload = {
  candidateName:
    candidateDetails.candidateName,

  contactNumber:
    candidateDetails.contactNumber,

  qualification:
    candidateDetails.qualification,

  location:
    candidateDetails.location,

  experience:
    candidateDetails.experience,

  response:
    statusLabels[status],

  responseCode:
    status,

  notes:
    tempCallNote,

  callNumber:
    selectedCall,

  date:
    selectedDate,
};

/*
 * Candidate opened from HR Calling Data.
 */
if (callingDataId) {
  await api.patch(
    `/hr-calling-data/${callingDataId}/call-response`,
    candidateResponsePayload
  );

  await fetchCandidateData();

  if (
    returnPage ===
    "interested-candidates"
  ) {
    navigate(
      "/hr/data-sheet/interested-candidates"
    );
  } else {
    navigate(
      `/hr/calling-data?tab=${returnTab}`
    );
  }
}

/*
 * Candidate entered manually from
 * HR Call Tracking.
 */
else {
  let manualCallingDataId =
    callCandidateDetails[
      selectedCall
    ]?.callingDataId || "";

  /*
   * If this call box already has a
   * manual calling-data record,
   * update that same candidate.
   */
  if (manualCallingDataId) {
    await api.patch(
      `/hr-calling-data/${manualCallingDataId}/call-response`,
      candidateResponsePayload
    );
  }

  /*
   * First time this manual call box
   * is being saved.
   */
  else {
    const {
      data: manualResponse,
    } = await api.post(
      "/hr-calling-data/manual-call-response",
      candidateResponsePayload
    );

    manualCallingDataId =
      manualResponse?.data?._id ||
      "";

    /*
     * Attach the generated callingDataId
     * back to this call box.
     *
     * This is what lets us update the
     * same candidate next time instead
     * of creating duplicate candidates.
     */
    if (manualCallingDataId) {
      const {
        data: linkedCallResponse,
      } = await api.post(
        "/hr-calls",
        {
          date: selectedDate,

          call: {
            callNumber:
              selectedCall,

            status,

            notes:
              tempCallNote,

            callingDataId:
              manualCallingDataId,

            candidateName:
              candidateDetails.candidateName,

            contactNumber:
              candidateDetails.contactNumber,

            qualification:
              candidateDetails.qualification,

            location:
              candidateDetails.location,

            experience:
              candidateDetails.experience,
          },
        }
      );

      const linkedCalls =
        linkedCallResponse?.data
          ?.calls || [];

      const updatedCandidateMap =
        {};

      linkedCalls.forEach(
        (savedCall) => {
          updatedCandidateMap[
            savedCall.callNumber
          ] = {
            callingDataId:
              savedCall.callingDataId ||
              "",

            candidateName:
              savedCall.candidateName ||
              "",

            contactNumber:
              savedCall.contactNumber ||
              "",

            qualification:
              savedCall.qualification ||
              "",

            location:
              savedCall.location ||
              "",

            experience:
              savedCall.experience ||
              "",
          };
        }
      );

      setCallCandidateDetails(
        updatedCandidateMap
      );
    }
  }
}

    setMessage(
      `Call ${selectedCall} saved successfully`
    );

    setShowCallPopup(false);
  } catch (error) {
    console.error(
      "Failed to save HR response",
      error
    );

    alert(
      error.response?.data?.message ||
        "Failed to save HR response"
    );

    /*
     * Reload the server version after any failed save.
     */
    await fetchHrCalls();
  } finally {
  savingRef.current = false;
  setIsSaving(false);
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
  disabled={isSaving}
  onChange={(e) => setSelectedDate(e.target.value)}
/>

      {!callsLoaded && !message && (
  <p className="hr-call-loading-message">
    Loading previous calls. Please do not save a
    call until loading is complete.
  </p>
)}

{callingDataId &&
  callsLoaded &&
  !candidateLoaded &&
  !candidateLoadError && (
    <p className="hr-call-loading-message">
      Loading candidate details. Saving is
      temporarily disabled.
    </p>
  )}

{candidateLoadError && (
  <div>
    <p className="hr-call-loading-message">
      {candidateLoadError}
    </p>

    <button
      type="button"
      disabled={isSaving}
      onClick={fetchCandidateData}
    >
      Retry Candidate Loading
    </button>
  </div>
)}

<div className="grid">
        {callNumbers.map((num) => (
          <button
  key={num}
  type="button"
  disabled={
  !callsLoaded ||
  isSaving ||
  (Boolean(callingDataId) && !candidateLoaded)
}
  className={`box ${
    statusColors[callStatuses[num]] || ""
  }`}
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
            onClick={() => {if (!isSaving) {setShowCallPopup(false);}}}
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
                disabled={isSaving}
                onChange={handleInputChange}
              />

              <input
                name="contactNumber"
                placeholder="Contact Number"
                value={candidateDetails.contactNumber}
                disabled={isSaving}
                onChange={handleInputChange}
              />

              <input
                name="qualification"
                placeholder="Qualification"
                value={candidateDetails.qualification}
                disabled={isSaving}
                onChange={handleInputChange}
              />

              <input
                name="location"
                placeholder="Location"
                value={candidateDetails.location}
                disabled={isSaving}
                onChange={handleInputChange}
              />

              <input
                name="experience"
                placeholder="Experience"
                value={candidateDetails.experience}
                disabled={isSaving}
                onChange={handleInputChange}
              />
            </div>

            <textarea
              placeholder="Add comment..."
              value={tempCallNote}
              disabled={isSaving}
              onChange={(e) => setTempCallNote(e.target.value)}
            />

            <div className="popup-status-grid">
              {allStatuses.map((code) => (
                <button
                  key={code}
                  type="button"
                  disabled={
  isSaving ||
  !callsLoaded ||
  (Boolean(callingDataId) && !candidateLoaded)
}
                  className={`popup-status-btn ${statusColors[code]}`}
                  onClick={() => handleResponseClick(code)}
                  title={statusLabels[code]}
                >
                  {statusLabels[code]}
                </button>
              ))}
            </div>

            {isSaving && (
              <p className="hr-call-saving-message">
                Saving call. Please wait...
              </p>
            )}

            <button
              type="button"
              disabled={isSaving}
              style={{
                marginTop: "10px",
                width: "100%",
              }}
              onClick={() => setShowCallPopup(false)}
            >
              {isSaving ? "Saving..." : "Close"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HrTmcPage;