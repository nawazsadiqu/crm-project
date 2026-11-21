import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import api from "../services/api";
import "../css/appointments.css";
import "../css/appointmentsReminder.css";


const APPOINTMENTS_FILTER_STORAGE_KEY =
  "appointmentsFilters";


const formatLocalDate = (date) => {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

};


const AppointmentsPage = () => {

  const location =
    useLocation();

  const navigate =
    useNavigate();

  // Reminders passes the exact PresentationDetail _id.
  // The same AppointmentsPage component serves both BA and Telecaller.
  const reminderTarget =
    location.state?.fromReminders &&
      location.state?.reminderTarget?.type === "appointment"
      ? location.state.reminderTarget
      : null;

  const reminderRecordId = String(
    reminderTarget?.recordId || ""
  );


  /*
  ==========================================
  ROLE / ROUTE DETECTION
  ==========================================
  */

  const isTelecaller =
    location.pathname.startsWith(
      "/telecaller"
    );


  const dataSheetPath =
    isTelecaller
      ? "/telecaller/data-sheet"
      : "/ba/data-sheet";


  const tmcPath =
    isTelecaller
      ? "/telecaller/tmc"
      : "/ba/tmc";


  const appointmentsPath =
    isTelecaller
      ? "/telecaller/appointments"
      : "/ba/appointments";


  /*
  ==========================================
  CURRENT DATE
  ==========================================
  */

  const today =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kolkata",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    ).format(
      new Date()
    );


  const currentMonth =
    today.slice(
      0,
      7
    );


  /*
  ==========================================
  SAVED FILTERS
  ==========================================
  */

  let savedFilters = {};


  try {

    savedFilters =
      JSON.parse(
        sessionStorage.getItem(
          APPOINTMENTS_FILTER_STORAGE_KEY
        ) || "{}"
      );

  } catch {

    savedFilters = {};

  }


  /*
  ==========================================
  STATE
  ==========================================
  */

  const [
    selectedMonth,
    setSelectedMonth
  ] = useState(
    savedFilters.selectedMonth ||
    currentMonth
  );


  const [
    viewMode,
    setViewMode
  ] = useState(
    reminderRecordId
      ? "weekly"
      : savedFilters.viewMode || "weekly"
  );


  const [
    selectedDate,
    setSelectedDate
  ] = useState(
    savedFilters.selectedDate ||
    today
  );


  const [
    appointments,
    setAppointments
  ] = useState([]);


  const [
    activeTab,
    setActiveTab
  ] = useState(
    reminderRecordId
      ? "all"
      : savedFilters.activeTab || "all"
  );


  const [
    searchTerm,
    setSearchTerm
  ] = useState(
    reminderRecordId
      ? ""
      : savedFilters.searchTerm || ""
  );


  const [
    message,
    setMessage
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(false);

  const [focusedReminderId, setFocusedReminderId] =
    useState(reminderRecordId);

  const focusedRowRef = useRef(null);
  const focusedNotesRef = useRef(null);
  const lastFocusedReminderRef = useRef("");

  // New reminder navigation can occur while this component is mounted.
  useEffect(() => {
    if (!reminderRecordId) return;

    setFocusedReminderId(reminderRecordId);
    setViewMode("weekly");
    setActiveTab("all");
    setSearchTerm("");
    lastFocusedReminderRef.current = "";
  }, [reminderRecordId]);

  const showAllAppointments = () => {
    setFocusedReminderId("");
    lastFocusedReminderRef.current = "";
    navigate(location.pathname, { replace: true, state: null });
  };


  /*
  ==========================================
  SAVE FILTERS
  ==========================================
  */

  useEffect(() => {

    sessionStorage.setItem(
      APPOINTMENTS_FILTER_STORAGE_KEY,
      JSON.stringify({
        selectedMonth,
        selectedDate,
        viewMode,
        activeTab,
        searchTerm
      })
    );

  }, [
    selectedMonth,
    selectedDate,
    viewMode,
    activeTab,
    searchTerm
  ]);


  /*
  ==========================================
  FETCH APPOINTMENTS
  ==========================================
  */

  const fetchAppointments =
    async () => {

      try {

        setLoading(true);


        let url = "";


        /*
        DAILY
        */

        if (
          viewMode ===
          "daily"
        ) {

          url =
            `/presentation-details/appointments?date=${selectedDate}`;

        }

        /*
        WEEKLY / ALL
        */

        else {

          url =
            activeTab === "all"
              ? "/presentation-details/appointments?all=true"
              : `/presentation-details/appointments?month=${selectedMonth}`;

        }


        const { data } =
          await api.get(
            url
          );


        setAppointments(
          Array.isArray(data)
            ? data
            : []
        );


        setMessage("");

      } catch (error) {

        setAppointments(
          []
        );


        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to fetch appointments"
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    fetchAppointments();

  }, [
    selectedMonth,
    selectedDate,
    viewMode,
    activeTab
  ]);


  /*
  ==========================================
  LOCAL UPDATE HELPER
  ==========================================
  */

  const updateAppointmentLocally = (
    id,
    field,
    value
  ) => {

    setAppointments(
      (previous) =>
        previous.map(
          (item) =>

            item._id === id

              ? {
                ...item,

                [field]:
                  value
              }

              : item
        )
    );

  };


  /*
  ==========================================
  VISITED STATUS
  BA ONLY
  ==========================================
  */

  const handleVisitedChange =
    async (
      id,
      currentValue,
      visitedDate = ""
    ) => {

      /*
      Telecaller cannot mark
      appointment visited
      */

      if (
        isTelecaller
      ) {
        return;
      }


      try {

        await api.put(
          `/presentation-details/appointments/${id}/visit-status`,
          {
            isVisitedAppointment:
              !currentValue,

            visitedDate:
              !currentValue
                ? visitedDate
                : ""
          }
        );


        setMessage(
          "Visited appointment status updated successfully"
        );


        setAppointments(
          (previous) =>
            previous.map(
              (row) =>

                row._id === id

                  ? {
                    ...row,

                    isVisitedAppointment:
                      !currentValue,

                    visitedDate:
                      !currentValue
                        ? visitedDate
                        : ""
                  }

                  : row
            )
        );

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to update visited appointment status"
        );

      }

    };


  /*
  ==========================================
  DELETE APPOINTMENT
  BA ONLY
  ==========================================
  */

  const handleDeleteAppointment =
    async (id) => {

      if (
        isTelecaller
      ) {
        return;
      }


      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this appointment?"
        );


      if (
        !confirmDelete
      ) {
        return;
      }


      try {

        await api.delete(
          `/presentation-details/${id}`
        );


        setMessage(
          "Appointment deleted successfully"
        );


        fetchAppointments();

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to delete appointment"
        );

      }

    };


  /*
  ==========================================
  NOT INTERESTED
  BA ONLY
  ==========================================
  */

  const handleNotInterested =
    async (item) => {

      if (
        isTelecaller
      ) {
        return;
      }


      const confirmUpdate =
        window.confirm(
          `Mark ${item.businessName ||
          "this business"
          } as Not Interested?`
        );


      if (
        !confirmUpdate
      ) {
        return;
      }


      try {

        const { data } =
          await api.put(
            `/presentation-details/appointments/${item._id}/not-interested`
          );


        setAppointments(
          (previous) =>
            previous.map(
              (
                appointment
              ) =>

                appointment._id ===
                  item._id

                  ? data.data

                  : appointment
            )
        );


        setMessage(
          "Appointment moved to Not Interested successfully"
        );

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to mark appointment as Not Interested"
        );

      }

    };


  /*
  ==========================================
  BUSINESS CLICK
  BA ONLY
  ==========================================
  */

  const handleBusinessClick = (
    item
  ) => {

    if (
      isTelecaller
    ) {
      return;
    }


    navigate(
      tmcPath,
      {
        state: {

          returnTo:
            appointmentsPath,


          callingData: {

            businessName:
              item.businessName ||
              "",


            mapLink:
              item.mapLink ||
              "",


            contactNumber:
              item.contact ||
              "",


            mobileNumber:
              item.contact ||
              "",


            date:
              item.date ||
              "",


            presentationId:
              item._id

          }

        }

      }
    );

  };


  /*
  ==========================================
  SAVE APPOINTMENT DATE
  BA ONLY
  ==========================================
  */

  const saveAppointmentDate =
    async (item) => {

      if (
        isTelecaller
      ) {
        return;
      }


      try {

        await api.put(
          `/presentation-details/appointments/${item._id}/appointment-date`,
          {
            appointmentDate:
              item.appointmentDate
          }
        );


        setMessage(
          "Appointment date updated successfully"
        );

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to update appointment date"
        );

      }

    };


  /*
  ==========================================
  SAVE NOTES
  BA ONLY
  ==========================================
  */

  const saveNotes =
    async (item) => {

      if (
        isTelecaller
      ) {
        return;
      }


      try {

        await api.put(
          `/presentation-details/appointments/${item._id}/notes`,
          {
            notes:
              item.notes ||
              ""
          }
        );


        setMessage(
          "Notes updated successfully"
        );

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to update notes"
        );

      }

    };


  /*
  ==========================================
  SAVE RESPONSE
  BA ONLY
  ==========================================
  */

  const saveResponse =
    async (item) => {

      if (
        isTelecaller
      ) {
        return;
      }


      try {

        await api.put(
          `/presentation-details/appointments/${item._id}/response`,
          {
            response:
              item.response ||
              ""
          }
        );


        setMessage(
          "Response updated successfully"
        );

      } catch (error) {

        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to update response"
        );

      }

    };


  /*
  ==========================================
  MONTH WEEKS
  ==========================================
  */

  const getWeeksInMonth = (
    monthValue
  ) => {

    const [
      year,
      month
    ] =
      monthValue
        .split("-")
        .map(Number);


    const firstDay =
      new Date(
        year,
        month - 1,
        1
      );


    const lastDay =
      new Date(
        year,
        month,
        0
      );


    const weeks = [];


    let start =
      new Date(
        firstDay
      );


    let weekNumber = 1;


    while (
      start <= lastDay
    ) {

      const end =
        new Date(
          start
        );


      end.setDate(
        start.getDate() +
        6
      );


      if (
        end >
        lastDay
      ) {

        end.setTime(
          lastDay.getTime()
        );

      }


      weeks.push({

        key:
          `week-${weekNumber}`,

        label:
          `Week ${weekNumber}`,

        startDate:
          formatLocalDate(
            start
          ),

        endDate:
          formatLocalDate(
            end
          )

      });


      start =
        new Date(
          end
        );


      start.setDate(
        start.getDate() +
        1
      );


      weekNumber += 1;

    }


    return weeks;

  };


  const monthWeeks =
    getWeeksInMonth(
      selectedMonth
    );


  /*
  ==========================================
  FILTER APPOINTMENTS
  ==========================================
  */

  const getVisibleAppointments =
    () => {

      let list = [
        ...appointments
      ];


      /*
      DAILY
      */

      if (
        viewMode ===
        "daily"
      ) {

        list =
          list.filter(
            (item) =>
              item.date ===
              selectedDate
          );


        list.sort(
          (a, b) =>
            String(
              a.appointmentTime ||
              ""
            ).localeCompare(
              String(
                b.appointmentTime ||
                ""
              )
            )
        );


        return list;

      }


      /*
      WEEK FILTER
      */

      if (
        activeTab !==
        "all"
      ) {

        const selectedWeek =
          monthWeeks.find(
            (week) =>
              week.key ===
              activeTab
          );


        if (
          selectedWeek
        ) {

          list =
            list.filter(
              (item) =>

                item.date >=
                selectedWeek.startDate &&

                item.date <=
                selectedWeek.endDate
            );

        }

      }


      /*
      ALL APPOINTMENTS
      */

      if (
        activeTab ===
        "all"
      ) {

        list.sort(
          (a, b) => {

            const aVisited =
              !!a.isVisitedAppointment;


            const bVisited =
              !!b.isVisitedAppointment;


            /*
            Not visited first
            */

            if (
              aVisited !==
              bVisited
            ) {

              return aVisited
                ? 1
                : -1;

            }


            const aDate =
              a.appointmentDate ||
              "9999-12-31";


            const bDate =
              b.appointmentDate ||
              "9999-12-31";


            const aPast =
              aDate <
              today;


            const bPast =
              bDate <
              today;


            if (
              aPast !==
              bPast
            ) {

              return aPast
                ? 1
                : -1;

            }


            return (
              aDate.localeCompare(
                bDate
              )
            );

          }
        );

      }


      return list;

    };


  const visibleAppointments =
    getVisibleAppointments();


  /*
  ==========================================
  ACTIVE APPOINTMENTS
  ==========================================
  */

  const activeAppointments =
    visibleAppointments.filter(
      (item) =>

        item.status ===
        "Appointment Fixed" &&

        !item.rejectedFromAppointment
    );


  /*
  ==========================================
  NOT INTERESTED APPOINTMENTS
  ==========================================
  */

  const notInterestedAppointments =
    visibleAppointments.filter(
      (item) =>

        item.status ===
        "Rejected" &&

        item.rejectedFromAppointment
    );


  /*
  ==========================================
  SEARCH
  ==========================================
  */

  const matchesSearch = (
    item
  ) => {

    const search =
      searchTerm
        .trim()
        .toLowerCase();


    if (
      !search
    ) {
      return true;
    }


    return [

      item.date,

      item.appointmentDate,

      item.presentationNumber,

      item.status,

      item.businessName,

      item.mapLink,

      item.contact,

      item.notes,

      item.response,

      item.visitedDate,

      item.rejectionReason

    ]

      .map(
        (value) =>
          String(
            value ||
            ""
          ).toLowerCase()
      )

      .join(" ")

      .includes(
        search
      );

  };


  const searchedAppointments =
    activeAppointments
      .filter(matchesSearch)
      .filter(
        (item) =>
          !focusedReminderId ||
          String(item._id) === focusedReminderId
      );

  const focusedAppointment = focusedReminderId
    ? appointments.find(
      (item) => String(item._id) === focusedReminderId
    )
    : null;

  // Scroll to the exact row after the all-time API response renders.
  useEffect(() => {
    if (
      loading ||
      !focusedReminderId ||
      lastFocusedReminderRef.current === focusedReminderId ||
      !focusedRowRef.current
    ) {
      return;
    }

    focusedRowRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    // BA can edit notes; Telecaller's current page displays them read-only.
    if (!isTelecaller) {
      focusedNotesRef.current?.focus({ preventScroll: true });
    }

    lastFocusedReminderRef.current = focusedReminderId;
  }, [loading, focusedReminderId, appointments, isTelecaller]);


  const searchedNotInterestedAppointments =
    notInterestedAppointments.filter(
      matchesSearch
    );


  /*
  ==========================================
  UI
  ==========================================
  */

  return (

    <div className="appointments-page">


      <div className="appointments-card">


        {/* HEADER */}

        <div className="appointments-header">

          <div>

            <h2 className="appointments-title">

              Appointments

            </h2>


            <p className="appointments-subtitle">

              Appointment Fixed records from Presentation

            </p>

          </div>

        </div>


        {/* VIEW SWITCH */}

        <div className="appointments-view-switch">

          <button
            type="button"
            className={
              viewMode ===
                "weekly"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode(
                "weekly"
              )
            }
          >
            Weekly View
          </button>


          <button
            type="button"
            className={
              viewMode ===
                "daily"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode(
                "daily"
              )
            }
          >
            Daily View
          </button>

        </div>


        {/* FILTERS */}

        <div className="appointments-top-bar">


          {viewMode ===
            "weekly" && (

              <div className="appointments-filter-card">

                <label>
                  Select Month
                </label>


                <input
                  type="month"
                  value={
                    selectedMonth
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedMonth(
                      event.target.value
                    )
                  }
                />

              </div>

            )}


          {viewMode ===
            "daily" && (

              <div className="appointments-filter-card">

                <label>
                  Select Date
                </label>


                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedDate(
                      event.target.value
                    )
                  }
                />

              </div>

            )}


          <div className="appointments-filter-card appointments-search-card">

            <label>
              Search
            </label>


            <input
              type="text"
              placeholder="Search appointments..."
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          <div className="appointments-actions">

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                fetchAppointments
              }
              disabled={
                loading
              }
            >

              {loading
                ? "Loading..."
                : "Refresh"}

            </button>

          </div>

        </div>


        {/* WEEK TABS */}

        {viewMode ===
          "weekly" && (

            <div className="appointments-week-tabs">

              <button
                type="button"
                className={`appointments-week-tab ${activeTab ===
                    "all"
                    ? "active"
                    : ""
                  }`}
                onClick={() =>
                  setActiveTab(
                    "all"
                  )
                }
              >

                All Appointments

              </button>


              {monthWeeks.map(
                (week) => (

                  <button
                    key={
                      week.key
                    }
                    type="button"
                    className={`appointments-week-tab ${activeTab ===
                        week.key
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setActiveTab(
                        week.key
                      )
                    }
                  >

                    {week.label}

                  </button>

                )
              )}

            </div>

          )}


        {/* MESSAGE */}

        {message && (

          <p className="appointments-message">

            {message}

          </p>

        )}


        {/* REMINDER RECORD SELECTION */}

        {focusedReminderId && (
          <div className="appointments-reminder-banner">
            <div>
              <strong>Opened from Reminders</strong>
              <p>
                {loading
                  ? "Finding appointment..."
                  : focusedAppointment
                    ? `Selected: ${focusedAppointment.businessName || "Appointment"}`
                    : "This appointment is not available in your current list."}
              </p>
              {isTelecaller && (
                <p>
                  Appointment date and notes are read-only for Telecallers
                  on this page.
                </p>
              )}
            </div>
            <button type="button" onClick={showAllAppointments}>
              Show All Records
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <div className="appointments-summary-card">

          <div>

            <h3>
              Appointment Records
            </h3>


            <p>

              {viewMode ===
                "daily"

                ? `Appointments fixed on ${selectedDate}`

                : activeTab ===
                  "all"

                  ? "All appointment records"

                  : "Appointments fixed in the selected week"}

            </p>

          </div>


          <span className="appointments-count-badge">

            {searchedAppointments.length}

          </span>

        </div>


        {/* ACTIVE APPOINTMENTS */}

        {loading ? (

          <p className="appointments-loading">

            Loading appointments...

          </p>

        ) : searchedAppointments.length ===
          0 ? (

          <p className="appointments-empty">

            {viewMode ===
              "daily"
              ? "No appointments were fixed on the selected date."
              : "No appointments were fixed in the selected period."}

          </p>

        ) : (

          <div className="appointments-table-wrapper">

            <table className="appointments-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Appointment Date
                  </th>

                  <th>
                    Presentation No
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Business Name
                  </th>

                  <th>
                    Map Link
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Notes
                  </th>

                  {isTelecaller && (
                    <th>BA Visit Notes</th>
                  )}

                  <th>
                    Response
                  </th>

                  <th>
                    Visited
                  </th>

                  <th>
                    Visited Date
                  </th>


                  {!isTelecaller && (

                    <th>
                      Action
                    </th>

                  )}

                </tr>

              </thead>


              <tbody>

                {searchedAppointments.map(
                  (item) => (

                    <tr
                      key={
                        item._id
                      }
                      ref={
                        String(item._id) === focusedReminderId
                          ? focusedRowRef
                          : null
                      }
                      className={
                        String(item._id) === focusedReminderId
                          ? "appointments-reminder-target-row"
                          : ""
                      }
                    >


                      {/* DATE */}

                      <td>

                        {item.date ||
                          "-"}

                      </td>


                      {/* APPOINTMENT DATE */}

                      <td>

                        {isTelecaller ? (

                          item.appointmentDate ||
                          "-"

                        ) : (

                          <input
                            type="date"
                            value={
                              item.appointmentDate ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateAppointmentLocally(
                                item._id,
                                "appointmentDate",
                                event.target.value
                              )
                            }
                            onBlur={() =>
                              saveAppointmentDate(
                                item
                              )
                            }
                            className="visited-date-input"
                          />

                        )}

                      </td>


                      {/* PRESENTATION NO */}

                      <td>

                        {item.presentationNumber ??
                          "-"}

                      </td>


                      {/* STATUS */}

                      <td>

                        <span className="status-pill appointment-fixed">

                          {item.status ||
                            "Appointment Fixed"}

                        </span>

                      </td>


                      {/* BUSINESS */}

                      <td>

                        {isTelecaller ? (

                          item.businessName ||
                          "-"

                        ) : (

                          <button
                            type="button"
                            className="business-name-link"
                            onClick={() =>
                              handleBusinessClick(
                                item
                              )
                            }
                          >

                            {item.businessName ||
                              "-"}

                          </button>

                        )}

                      </td>


                      {/* MAP */}

                      <td>

                        {item.mapLink ? (

                          <a
                            href={
                              item.mapLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >

                            Open Map

                          </a>

                        ) : (

                          "-"

                        )}

                      </td>


                      {/* CONTACT */}

                      <td>

                        {item.contact ||
                          "-"}

                      </td>


                      {/* NOTES */}

                      <td>

                        {isTelecaller ? (

                          item.notes ||
                          "-"

                        ) : (

                          <textarea
                            ref={
                              String(item._id) === focusedReminderId
                                ? focusedNotesRef
                                : null
                            }
                            value={
                              item.notes ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateAppointmentLocally(
                                item._id,
                                "notes",
                                event.target.value
                              )
                            }
                            onBlur={() =>
                              saveNotes(
                                item
                              )
                            }
                            className="editable-textarea"
                            placeholder="Enter notes"
                          />

                        )}

                      </td>

                      {isTelecaller && (
                        <td>
                          {item.visitedResponse || "-"}
                        </td>
                      )}


                      {/* RESPONSE */}

                      <td>

                        {isTelecaller ? (

                          item.response ||
                          "-"

                        ) : (

                          <textarea
                            value={
                              item.response ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateAppointmentLocally(
                                item._id,
                                "response",
                                event.target.value
                              )
                            }
                            onBlur={() =>
                              saveResponse(
                                item
                              )
                            }
                            className="editable-textarea"
                            placeholder="Enter response"
                          />

                        )}

                      </td>


                      {/* VISITED */}

                      <td>

                        {isTelecaller ? (

                          <span
                            className={`status-pill ${item.isVisitedAppointment
                                ? "appointment-fixed"
                                : ""
                              }`}
                          >

                            {item.isVisitedAppointment
                              ? "Visited"
                              : "Not Visited"}

                          </span>

                        ) : (

                          <label className="visited-checkbox-cell">

                            <input
                              type="checkbox"
                              checked={
                                !!item.isVisitedAppointment
                              }
                              onChange={() =>
                                handleVisitedChange(
                                  item._id,
                                  item.isVisitedAppointment,
                                  item.visitedDate ||
                                  ""
                                )
                              }
                            />

                            <span>
                              Visited
                            </span>

                          </label>

                        )}

                      </td>


                      {/* VISITED DATE */}

                      <td>

                        {isTelecaller ? (

                          item.visitedDate ||
                          "-"

                        ) : (

                          <input
                            type="date"
                            value={
                              item.visitedDate ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateAppointmentLocally(
                                item._id,
                                "visitedDate",
                                event.target.value
                              )
                            }
                            className="visited-date-input"
                          />

                        )}

                      </td>


                      {/* ACTION */}

                      {!isTelecaller && (

                        <td>

                          <div
                            style={{
                              display:
                                "flex",

                              gap:
                                "8px",

                              flexWrap:
                                "wrap"
                            }}
                          >

                            <button
                              type="button"
                              className="btn"
                              style={{
                                background:
                                  "#f59e0b",

                                color:
                                  "#ffffff"
                              }}
                              onClick={() =>
                                handleNotInterested(
                                  item
                                )
                              }
                            >

                              Not Interested

                            </button>


                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() =>
                                handleDeleteAppointment(
                                  item._id
                                )
                              }
                            >

                              Delete

                            </button>

                          </div>

                        </td>

                      )}


                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


      </div>


      {/* ==========================================
          NOT INTERESTED
      ========================================== */}

      <div
        style={{
          marginTop:
            "36px",

          paddingTop:
            "24px",

          borderTop:
            "2px solid #fecaca",
          display: focusedReminderId ? "none" : undefined
        }}
      >


        <div className="appointments-summary-card">

          <div>

            <h3>
              Not Interested
            </h3>


            <p>

              Appointments marked as Not Interested

            </p>

          </div>


          <span className="appointments-count-badge">

            {
              searchedNotInterestedAppointments.length
            }

          </span>

        </div>


        {searchedNotInterestedAppointments
          .length ===
          0 ? (

          <p className="appointments-empty">

            No Not Interested appointments found.

          </p>

        ) : (

          <div className="appointments-table-wrapper">

            <table className="appointments-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Appointment Date
                  </th>

                  <th>
                    Presentation No
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Business Name
                  </th>

                  <th>
                    Map Link
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Notes
                  </th>

                  <th>
                    Response
                  </th>


                  {!isTelecaller && (

                    <th>
                      Action
                    </th>

                  )}

                </tr>

              </thead>


              <tbody>

                {searchedNotInterestedAppointments.map(
                  (item) => (

                    <tr
                      key={
                        item._id
                      }
                    >


                      <td>

                        {item.date ||
                          "-"}

                      </td>


                      <td>

                        {item.appointmentDate ||
                          "-"}

                      </td>


                      <td>

                        {item.presentationNumber ??
                          "-"}

                      </td>


                      <td>

                        <span
                          className="status-pill"
                          style={{
                            background:
                              "#fee2e2",

                            color:
                              "#991b1b"
                          }}
                        >

                          {item.rejectionReason ||
                            "Not Interested"}

                        </span>

                      </td>


                      <td>

                        {item.businessName ||
                          "-"}

                      </td>


                      <td>

                        {item.mapLink ? (

                          <a
                            href={
                              item.mapLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >

                            Open Map

                          </a>

                        ) : (

                          "-"

                        )}

                      </td>


                      <td>

                        {item.contact ||
                          "-"}

                      </td>


                      <td>

                        {item.notes ||
                          "-"}

                      </td>


                      <td>

                        {item.response ||
                          "-"}

                      </td>


                      {!isTelecaller && (

                        <td>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              handleDeleteAppointment(
                                item._id
                              )
                            }
                          >

                            Delete

                          </button>

                        </td>

                      )}


                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* BACK */}

      <div className="appointments-bottom-actions">

        <Link
          to={
            location.state?.fromReminders
              ? location.state.returnTo ||
              (isTelecaller
                ? "/telecaller/reminders"
                : "/ba/reminders")
              : dataSheetPath
          }
          className="btn btn-secondary"
        >

          Back

        </Link>

      </div>


    </div>

  );

};


export default AppointmentsPage;