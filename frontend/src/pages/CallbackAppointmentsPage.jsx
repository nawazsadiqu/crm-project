import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/appointments.css";

const CALLBACK_APPOINTMENT_VIEW_KEY =
  "callbackAppointmentSelectedView";

const CALLBACK_APPOINTMENT_MONTH_KEY =
  "callbackAppointmentSelectedMonth";

const CALLBACK_APPOINTMENT_WEEK_KEY =
  "callbackAppointmentSelectedWeek";

const formatLocalDate = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentMonth = () => {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getCurrentWeekValue = () => {
  const today = new Date();

  const currentDate = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  );

  const dayNumber =
    currentDate.getUTCDay() || 7;

  currentDate.setUTCDate(
    currentDate.getUTCDate() +
      4 -
      dayNumber
  );

  const yearStart = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      0,
      1
    )
  );

  const weekNumber = Math.ceil(
    ((currentDate - yearStart) /
      86400000 +
      1) /
      7
  );

  return `${currentDate.getUTCFullYear()}-W${String(
    weekNumber
  ).padStart(2, "0")}`;
};

const getWeekDateRange = (weekValue) => {
  if (!weekValue) {
    return {
      startDate: "",
      endDate: ""
    };
  }

  const [yearValue, weekValueNumber] =
    weekValue.split("-W");

  const year = Number(yearValue);
  const weekNumber = Number(
    weekValueNumber
  );

  const januaryFourth = new Date(
    year,
    0,
    4
  );

  const januaryFourthDay =
    januaryFourth.getDay() || 7;

  const monday = new Date(
    januaryFourth
  );

  monday.setDate(
    januaryFourth.getDate() -
      januaryFourthDay +
      1 +
      (weekNumber - 1) * 7
  );

  const sunday = new Date(monday);

  sunday.setDate(
    monday.getDate() + 6
  );

  return {
    startDate: formatLocalDate(monday),
    endDate: formatLocalDate(sunday)
  };
};

const CallbackAppointmentsPage = () => {
  const navigate = useNavigate();

  const currentMonth =
    getCurrentMonth();

  const currentWeek =
    getCurrentWeekValue();

  const [viewMode, setViewMode] =
    useState(
      sessionStorage.getItem(
        CALLBACK_APPOINTMENT_VIEW_KEY
      ) || "monthly"
    );

  const [
    selectedMonth,
    setSelectedMonth
  ] = useState(
    sessionStorage.getItem(
      CALLBACK_APPOINTMENT_MONTH_KEY
    ) || currentMonth
  );

  const [
    selectedWeek,
    setSelectedWeek
  ] = useState(
    sessionStorage.getItem(
      CALLBACK_APPOINTMENT_WEEK_KEY
    ) || currentWeek
  );

  const [
    callbackAppointments,
    setCallbackAppointments
  ] = useState([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [notesData, setNotesData] =
    useState({});

  const [searchTerm, setSearchTerm] =
    useState("");

  const fetchCallbackAppointments =
    async () => {
      try {
        setLoading(true);

        let url =
          "/presentation-details/callback-appointments";

        if (viewMode === "monthly") {
          url +=
            `?view=monthly` +
            `&month=${selectedMonth}`;
        }

        if (viewMode === "weekly") {
          const {
            startDate,
            endDate
          } = getWeekDateRange(
            selectedWeek
          );

          url +=
            `?view=weekly` +
            `&startDate=${startDate}` +
            `&endDate=${endDate}`;
        }

        if (viewMode === "all") {
          url += "?view=all";
        }

        const { data } =
          await api.get(url);

        const records =
          Array.isArray(data)
            ? data
            : [];

        setCallbackAppointments(
          records
        );

        const notesObj = {};

        records.forEach((item) => {
          notesObj[item._id] =
            item.notes || "";
        });

        setNotesData(notesObj);
        setMessage("");
      } catch (error) {
        console.error(
          "Failed to fetch callback appointments:",
          error
        );

        setCallbackAppointments(
          []
        );

        setNotesData({});

        setMessage(
          error.response?.data
            ?.message ||
            "Failed to fetch callback appointments"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchCallbackAppointments();
  }, [
    viewMode,
    selectedMonth,
    selectedWeek
  ]);

  useEffect(() => {
    sessionStorage.setItem(
      CALLBACK_APPOINTMENT_VIEW_KEY,
      viewMode
    );
  }, [viewMode]);

  useEffect(() => {
    sessionStorage.setItem(
      CALLBACK_APPOINTMENT_MONTH_KEY,
      selectedMonth
    );
  }, [selectedMonth]);

  useEffect(() => {
    sessionStorage.setItem(
      CALLBACK_APPOINTMENT_WEEK_KEY,
      selectedWeek
    );
  }, [selectedWeek]);

  const handleBusinessClick = (
    item
  ) => {
    navigate("/ba/tmc", {
      state: {
        returnTo:
          "/ba/callback-appointments",

        callbackAppointment: {
          businessName:
            item.businessName || "",

          mapLink:
            item.mapLink || "",

          contactNumber:
            item.contact || ""
        }
      }
    });
  };

  const handleNotesChange = async (
    id,
    value
  ) => {
    setNotesData((previous) => ({
      ...previous,
      [id]: value
    }));

    try {
      await api.put(
        `/presentation-details/callback-appointments/${id}/notes`,
        {
          notes: value
        }
      );
    } catch (error) {
      console.error(
        "Failed to update notes:",
        error
      );

      setMessage(
        error.response?.data
          ?.message ||
          "Failed to update notes"
      );
    }
  };

  const handleCallbackDateChange =
    async (id, value) => {
      setCallbackAppointments(
        (previous) =>
          previous.map((item) =>
            item._id === id
              ? {
                  ...item,
                  callbackDate: value
                }
              : item
          )
      );

      try {
        await api.put(
          `/presentation-details/callback-appointments/${id}/callback-date`,
          {
            callbackDate: value
          }
        );

        setMessage("");
      } catch (error) {
        console.error(
          "Failed to update callback date:",
          error
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Failed to update callback date"
        );

        fetchCallbackAppointments();
      }
    };

    const handleNotInterested = async (item) => {
  const confirmUpdate = window.confirm(
    `Mark ${
      item.businessName || "this business"
    } as Not Interested?`
  );

  if (!confirmUpdate) {
    return;
  }

  try {
    const { data } = await api.put(
      `/presentation-details/callback-appointments/${item._id}/not-interested`
    );

    setCallbackAppointments((previous) =>
      previous.map((appointment) =>
        appointment._id === item._id
          ? data.data
          : appointment
      )
    );

    setMessage(
      "Callback appointment moved to Not Interested successfully"
    );
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Failed to mark callback appointment as Not Interested"
    );
  }
};

  const handleDeleteCallbackAppointment =
    async (
      id,
      businessName
    ) => {
      const confirmDelete =
        window.confirm(
          `Are you sure you want to delete ${
            businessName ||
            "this callback appointment"
          }?`
        );

      if (!confirmDelete) {
        return;
      }

      try {
        await api.delete(
          `/presentation-details/${id}`
        );

        setCallbackAppointments(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !== id
            )
        );

        setNotesData(
          (previous) => {
            const updatedNotes = {
              ...previous
            };

            delete updatedNotes[id];

            return updatedNotes;
          }
        );

        setMessage(
          "Callback appointment deleted successfully"
        );
      } catch (error) {
        console.error(
          "Failed to delete callback appointment:",
          error
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Failed to delete callback appointment"
        );
      }
    };

  const search =
    searchTerm
      .trim()
      .toLowerCase();

  const filteredCallbackAppointments =
    callbackAppointments
      .filter((item) => {
        if (!search) {
          return true;
        }

        const searchableText = [
          item.businessName,
          item.contact,
          item.mapLink,
          item.callbackDate,
          item.date,
          item.status,
          item.presentationNumber,
          item.callbackRejectionReason,
          notesData[item._id]
        ]
          .map((value) =>
            String(value || "")
              .toLowerCase()
          )
          .join(" ");

        return searchableText.includes(
          search
        );
      })
      .sort((a, b) => {
        const today =
          formatLocalDate(new Date());

        const aDate =
          a.callbackDate || "";

        const bDate =
          b.callbackDate || "";

        if (!aDate && !bDate) {
          return 0;
        }

        if (!aDate) {
          return 1;
        }

        if (!bDate) {
          return -1;
        }

        const aIsFutureOrToday =
          aDate >= today;

        const bIsFutureOrToday =
          bDate >= today;

        if (
          aIsFutureOrToday &&
          !bIsFutureOrToday
        ) {
          return -1;
        }

        if (
          !aIsFutureOrToday &&
          bIsFutureOrToday
        ) {
          return 1;
        }

        if (
          aIsFutureOrToday &&
          bIsFutureOrToday
        ) {
          return aDate.localeCompare(
            bDate
          );
        }

        return bDate.localeCompare(
          aDate
        );
      });

      const activeCallbackAppointments =
  filteredCallbackAppointments.filter(
    (item) =>
      !item.isCallbackNotInterested
  );

const notInterestedCallbackAppointments =
  filteredCallbackAppointments.filter(
    (item) =>
      item.isCallbackNotInterested
  );

  const getSummaryText = () => {
    if (viewMode === "weekly") {
      const {
        startDate,
        endDate
      } = getWeekDateRange(
        selectedWeek
      );

      return `Records from ${startDate} to ${endDate}`;
    }

    if (viewMode === "all") {
      return "All callback appointment records";
    }

    return "Records found for the selected month";
  };

  const getEmptyMessage = () => {
    if (viewMode === "weekly") {
      return "No callback records found for this week.";
    }

    if (viewMode === "all") {
      return "No callback records found.";
    }

    return "No callback records found for this month.";
  };

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <div className="appointments-header">
          <div>
            <h2 className="appointments-title">
              Callback Appointments
            </h2>

            <p className="appointments-subtitle">
              CBC and CBA records from
              Presentation
            </p>
          </div>
        </div>

        <div className="appointments-top-bar">
          <div className="appointments-filter-card">
            <label>View</label>

            <select
              value={viewMode}
              onChange={(event) =>
                setViewMode(
                  event.target.value
                )
              }
            >
              <option value="monthly">
                Monthly
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="all">
                All Time
              </option>
            </select>
          </div>

          {viewMode === "monthly" && (
            <div className="appointments-filter-card">
              <label>
                Select Month
              </label>

              <input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(
                    event.target.value
                  )
                }
              />
            </div>
          )}

          {viewMode === "weekly" && (
            <div className="appointments-filter-card">
              <label>
                Select Week
              </label>

              <input
                type="week"
                value={selectedWeek}
                onChange={(event) =>
                  setSelectedWeek(
                    event.target.value
                  )
                }
              />
            </div>
          )}

          <div className="appointments-filter-card appointments-search-card">
            <label>Search</label>

            <input
              type="text"
              placeholder="Search name, number, map, notes..."
              value={searchTerm}
              onChange={(event) =>
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
                fetchCallbackAppointments
              }
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {message && (
          <p className="appointments-message">
            {message}
          </p>
        )}

        <div className="appointments-summary-card">
          <div>
            <h3>Callback Records</h3>

            <p>{getSummaryText()}</p>
          </div>

          <span className="appointments-count-badge">
            {activeCallbackAppointments.length}
          </span>
        </div>

        {loading ? (
          <p className="appointments-loading">
            Loading callback records...
          </p>
        ) : activeCallbackAppointments
            .length === 0 ? (
          <p className="appointments-empty">
            {getEmptyMessage()}
          </p>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Callback Date</th>
                  <th>Pr No</th>
                  <th>Status</th>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {activeCallbackAppointments.map(
                  (item) => (
                    <tr
                      key={item._id}
                      className="clickable-row"
                      onClick={() =>
                        handleBusinessClick(
                          item
                        )
                      }
                    >
                      <td>
                        {item.date ||
                          "-"}
                      </td>

                      <td
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        <input
                          type="date"
                          value={
                            item.callbackDate ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            handleCallbackDateChange(
                              item._id,
                              event.target
                                .value
                            )
                          }
                          className="appointment-date-input"
                        />
                      </td>

                      <td>
                        {item.presentationNumber ??
                          "-"}
                      </td>

                      <td>
                        <span
                          style={{
                            padding:
                              "4px 10px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "12px",
                            fontWeight:
                              "700",
                            background:
                              item.status ===
                              "CBA"
                                ? "#dbeafe"
                                : "#fef3c7",
                            color:
                              item.status ===
                              "CBA"
                                ? "#1d4ed8"
                                : "#92400e"
                          }}
                        >
                          {item.status ||
                            "-"}
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
                            onClick={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
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

                      <td
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        <textarea
                          value={
                            notesData[
                              item._id
                            ] || ""
                          }
                          onChange={(
                            event
                          ) =>
                            handleNotesChange(
                              item._id,
                              event.target
                                .value
                            )
                          }
                          className="appointment-notes-input"
                          placeholder="Add notes"
                        />
                      </td>

                      <td
  onClick={(event) =>
    event.stopPropagation()
  }
>
  <div
    style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap"
    }}
  >
    <button
      type="button"
      className="btn"
      style={{
        background: "#f59e0b",
        color: "#ffffff"
      }}
      onClick={(event) => {
        event.stopPropagation();
        handleNotInterested(item);
      }}
    >
      Not Interested
    </button>

    <button
      type="button"
      className="btn btn-danger callback-delete-btn"
      onClick={(event) => {
        event.stopPropagation();

        handleDeleteCallbackAppointment(
          item._id,
          item.businessName
        );
      }}
    >
      Delete
    </button>
  </div>
</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
  style={{
    marginTop: "36px",
    paddingTop: "24px",
    borderTop: "2px solid #fecaca"
  }}
>
  <div className="appointments-summary-card">
    <div>
      <h3>Not Interested</h3>

      <p>
        Callback appointments marked as
        Not Interested
      </p>
    </div>

    <span className="appointments-count-badge">
      {notInterestedCallbackAppointments.length}
    </span>
  </div>

  {notInterestedCallbackAppointments.length === 0 ? (
    <p className="appointments-empty">
      No Not Interested callback appointments found.
    </p>
  ) : (
    <div className="appointments-table-wrapper">
      <table className="appointments-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Callback Date</th>
            <th>Pr No</th>
            <th>Original Status</th>
            <th>Business Name</th>
            <th>Map Link</th>
            <th>Contact</th>
            <th>Notes</th>
            <th>Current Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {notInterestedCallbackAppointments.map(
            (item) => (
              <tr key={item._id}>
                <td>{item.date || "-"}</td>

                <td>
                  {item.callbackDate || "-"}
                </td>

                <td>
                  {item.presentationNumber ?? "-"}
                </td>

                <td>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background:
                        item.status === "CBA"
                          ? "#dbeafe"
                          : "#fef3c7",
                      color:
                        item.status === "CBA"
                          ? "#1d4ed8"
                          : "#92400e"
                    }}
                  >
                    {item.status || "-"}
                  </span>
                </td>

                <td>
                  {item.businessName || "-"}
                </td>

                <td>
                  {item.mapLink ? (
                    <a
                      href={item.mapLink}
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
                  {item.contact || "-"}
                </td>

                <td>
                  {notesData[item._id] ||
                    item.notes ||
                    "-"}
                </td>

                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "5px 10px",
                      borderRadius: "999px",
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: "12px",
                      fontWeight: "700"
                    }}
                  >
                    {item.callbackRejectionReason ||
                      "Not Interested"}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      handleDeleteCallbackAppointment(
                        item._id,
                        item.businessName
                      )
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )}
</div>

      <div className="appointments-bottom-actions">
        <Link
          to="/ba/data-sheet"
          className="btn btn-secondary"
        >
          Back
        </Link>
      </div>
    </div>
  );
};

export default CallbackAppointmentsPage;