import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiMapPin, FiPhone, FiTrash2 } from "react-icons/fi";
import api from "../services/api";
import "../css/reminders.css";

const RemindersPage = () => {
  const navigate = useNavigate();

  const [reminderData, setReminderData] = useState({
    date: "",
    appointments: [],
    callbackAppointments: []
  });

  const [clearedReminderIds, setClearedReminderIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getTodayIST = () => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  };

  const getReminderStorageKey = (dateValue) => {
    return `baDashboardClearedReminders-${dateValue || getTodayIST()}`;
  };

  const getStoredClearedReminderIds = (dateValue) => {
    try {
      return JSON.parse(
        localStorage.getItem(getReminderStorageKey(dateValue)) || "[]"
      );
    } catch {
      return [];
    }
  };

  const fetchTodayReminders = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/ba-reminders/today");

      const reminderDate = data.date || getTodayIST();

      setReminderData({
        date: reminderDate,
        appointments: Array.isArray(data.appointments)
          ? data.appointments
          : [],
        callbackAppointments: Array.isArray(data.callbackAppointments)
          ? data.callbackAppointments
          : []
      });

      setClearedReminderIds(getStoredClearedReminderIds(reminderDate));
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Failed to fetch reminders");
      setReminderData({
        date: getTodayIST(),
        appointments: [],
        callbackAppointments: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayReminders();

    const timer = setInterval(() => {
      fetchTodayReminders();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const allTodayReminders = [
    ...reminderData.appointments.map((item) => ({
      ...item,
      reminderTypeLabel: "Appointment",
      reminderDateLabel: item.appointmentDate,
      reminderPageType: "appointment"
    })),
    ...reminderData.callbackAppointments.map((item) => ({
      ...item,
      reminderTypeLabel: "Callback Appointment",
      reminderDateLabel: item.callbackDate,
      reminderPageType: "callback"
    }))
  ];

  const visibleTodayReminders = allTodayReminders.filter(
    (item) => !clearedReminderIds.includes(item.reminderId)
  );

  const appointmentCount = visibleTodayReminders.filter(
    (item) => item.reminderPageType === "appointment"
  ).length;

  const callbackCount = visibleTodayReminders.filter(
    (item) => item.reminderPageType === "callback"
  ).length;

  const handleClearReminder = (reminderId) => {
    const updatedIds = Array.from(
      new Set([...clearedReminderIds, reminderId])
    );

    localStorage.setItem(
      getReminderStorageKey(reminderData.date),
      JSON.stringify(updatedIds)
    );

    setClearedReminderIds(updatedIds);
  };

  const handleClearAllReminders = () => {
    const allIds = allTodayReminders.map((item) => item.reminderId);

    localStorage.setItem(
      getReminderStorageKey(reminderData.date),
      JSON.stringify(allIds)
    );

    setClearedReminderIds(allIds);
  };

  const handleReminderGoToTmc = (item) => {
    if (item.reminderPageType === "appointment") {
      navigate("/ba/tmc", {
        state: {
          callingData: {
            businessName: item.businessName || "",
            mapLink: item.mapLink || "",
            contactNumber: item.contact || "",
            mobileNumber: item.contact || ""
          },
          returnTo: "/ba/reminders"
        }
      });

      return;
    }

    navigate("/ba/tmc", {
      state: {
        callbackAppointment: {
          businessName: item.businessName || "",
          mapLink: item.mapLink || "",
          contactNumber: item.contact || ""
        },
        returnTo: "/ba/reminders"
      }
    });
  };

  return (
    <div className="reminders-page">
      <div className="reminders-card">
        <div className="reminders-header">
          <div>
            <h2 className="reminders-title">Today&apos;s Reminders</h2>
            <p className="reminders-subtitle">
              View today&apos;s appointments and callback appointments
            </p>
          </div>

          <div className="reminders-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={fetchTodayReminders}
            >
              Refresh
            </button>

            <Link to="/ba" className="btn btn-secondary">
              Back
            </Link>
          </div>
        </div>

        {message && <p className="reminders-message">{message}</p>}

        <div className="reminders-summary-grid">
          <div className="reminders-summary-box">
            <span>Total Reminders</span>
            <strong>{visibleTodayReminders.length}</strong>
            <p>{reminderData.date || getTodayIST()}</p>
          </div>

          <div className="reminders-summary-box appointment">
            <span>Appointments</span>
            <strong>{appointmentCount}</strong>
            <p>Appointment date is today</p>
          </div>

          <div className="reminders-summary-box callback">
            <span>Callbacks</span>
            <strong>{callbackCount}</strong>
            <p>Callback date is today</p>
          </div>
        </div>

        <div className="reminders-toolbar">
          <div>
            <h3>Reminder List</h3>
            <p>Click any card to open TMC with details</p>
          </div>

          {visibleTodayReminders.length > 0 && (
            <button
              type="button"
              className="reminders-clear-all-btn"
              onClick={handleClearAllReminders}
            >
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <p className="reminders-empty">Loading reminders...</p>
        ) : visibleTodayReminders.length === 0 ? (
          <p className="reminders-empty">
            No appointments or callback appointments for today.
          </p>
        ) : (
          <div className="reminders-list">
            {visibleTodayReminders.map((item) => (
              <div
                key={item.reminderId}
                className={`reminders-item ${item.reminderPageType}`}
                role="button"
                tabIndex={0}
                onClick={() => handleReminderGoToTmc(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleReminderGoToTmc(item);
                  }
                }}
              >
                <div className="reminders-item-main">
                  <span className="reminders-type-pill">
                    <FiBell />
                    {item.reminderTypeLabel}
                  </span>

                  <h4>{item.businessName || "-"}</h4>

                  <div className="reminders-meta-grid">
                    <p>
                      <strong>Status:</strong> {item.status || "-"}
                    </p>

                    <p>
                      <strong>Date:</strong> {item.reminderDateLabel || "-"}
                    </p>

                    <p>
                      <FiPhone />
                      {item.contact || "-"}
                    </p>

                    {item.mapLink && (
                      <a
                        href={item.mapLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiMapPin />
                        Open Map
                      </a>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="reminders-clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearReminder(item.reminderId);
                  }}
                >
                  <FiTrash2 />
                  Clear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;