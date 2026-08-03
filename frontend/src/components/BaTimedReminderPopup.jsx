import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  FiBell,
  FiClock,
  FiMapPin,
  FiPhone
} from "react-icons/fi";

import {
  useNavigate
} from "react-router-dom";

import api from "../services/api";

const BaTimedReminderPopup = () => {
  const navigate = useNavigate();

  const [
    activeReminder,
    setActiveReminder
  ] = useState(null);

  const activeReminderRef =
    useRef(null);

  const getTodayIST = () => {
    return new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).format(new Date());
  };

  const formatReminderTime = (
    timeValue
  ) => {
    if (!timeValue) {
      return "-";
    }

    const [
      hourValue,
      minuteValue
    ] = String(
      timeValue
    ).split(":");

    const hour =
      Number(hourValue);

    const period =
      hour >= 12
        ? "PM"
        : "AM";

    return `${
      hour % 12 || 12
    }:${minuteValue || "00"} ${period}`;
  };

  const getPopupStorageKey = (
    reminder
  ) => {
    return (
      "baTimedReminderShown-" +
      `${reminder.reminderDate}-` +
      reminder.reminderId
    );
  };

  const getScheduledTime = (
    dateValue,
    timeValue
  ) => {
    if (
      !dateValue ||
      !timeValue
    ) {
      return Number.NaN;
    }

    /*
      Explicit IST offset prevents browser
      timezone differences.
    */
    return new Date(
      `${dateValue}T${timeValue}:00+05:30`
    ).getTime();
  };

  const checkTimedReminders = (
    apiData
  ) => {
    if (
      activeReminderRef.current
    ) {
      return;
    }

    const today =
      apiData.date ||
      getTodayIST();

    const callbackAppointments =
      Array.isArray(
        apiData.callbackAppointments
      )
        ? apiData.callbackAppointments
        : [];

    const callbackPresentations =
      Array.isArray(
        apiData.callbackPresentations
      )
        ? apiData.callbackPresentations
        : [];

    const timedReminders = [
      ...callbackAppointments.map(
        (item) => ({
          ...item,

          reminderPageType:
            "callback",

          reminderTypeLabel:
            "Callback Appointment",

          reminderDate:
            item.callbackDate,

          reminderTime:
            item.callbackTime,

          leadMinutes: 60
        })
      ),

      ...callbackPresentations.map(
        (item) => ({
          ...item,

          reminderPageType:
            "callback-presentation",

          reminderTypeLabel:
            "Callback Presentation",

          reminderDate:
            item.callbackDate,

          reminderTime:
            item.callbackTime,

          leadMinutes: 5
        })
      )
    ];

    const now = Date.now();

    const dueReminder =
      timedReminders
        .filter((item) => {
          const scheduledTime =
            getScheduledTime(
              item.reminderDate,
              item.reminderTime
            );

          if (
            Number.isNaN(
              scheduledTime
            )
          ) {
            return false;
          }

          const triggerTime =
            scheduledTime -
            item.leadMinutes *
              60 *
              1000;

          const alreadyShown =
            localStorage.getItem(
              getPopupStorageKey(
                item
              )
            ) === "1";

          return (
            !alreadyShown &&
            now >= triggerTime &&
            now <= scheduledTime
          );
        })
        .sort((first, second) => {
          return (
            getScheduledTime(
              first.reminderDate,
              first.reminderTime
            ) -
            getScheduledTime(
              second.reminderDate,
              second.reminderTime
            )
          );
        })[0];

    if (!dueReminder) {
      return;
    }

    localStorage.setItem(
      getPopupStorageKey(
        dueReminder
      ),
      "1"
    );

    activeReminderRef.current =
      dueReminder;

    setActiveReminder(
      dueReminder
    );
  };

  const fetchReminders =
    async () => {
      try {
        const { data } =
          await api.get(
            "/ba-reminders/today"
          );

        checkTimedReminders(
          data || {}
        );
      } catch (error) {
        console.error(
          "Timed reminder error:",
          error
        );
      }
    };

  useEffect(() => {
    fetchReminders();

    const timer = setInterval(
      fetchReminders,
      60000
    );

    return () =>
      clearInterval(timer);
  }, []);

  const closePopup = () => {
    activeReminderRef.current =
      null;

    setActiveReminder(null);
  };

  const handleGoToTmc = () => {
    if (!activeReminder) {
      return;
    }

    const returnTo =
      window.location.pathname;

    if (
      activeReminder.reminderPageType ===
      "callback-presentation"
    ) {
      navigate("/ba/tmc", {
        state: {
          callbackPresentation: {
            businessName:
              activeReminder.businessName ||
              "",

            mapLink:
              activeReminder.mapLink ||
              "",

            contactNumber:
              activeReminder.contact ||
              ""
          },

          returnTo
        }
      });
    } else {
      navigate("/ba/tmc", {
        state: {
          callbackAppointment: {
            businessName:
              activeReminder.businessName ||
              "",

            mapLink:
              activeReminder.mapLink ||
              "",

            contactNumber:
              activeReminder.contact ||
              ""
          },

          returnTo
        }
      });
    }

    closePopup();
  };

  if (!activeReminder) {
    return null;
  }

  return (
    <div className="ba-timed-reminder-overlay">
      <div className="ba-timed-reminder-popup">
        <div className="ba-timed-reminder-icon">
          <FiBell />
        </div>

        <span className="ba-timed-reminder-type">
          {
            activeReminder.reminderTypeLabel
          }
        </span>

        <h2>
          Reminder for{" "}
          {activeReminder.businessName ||
            "Business"}
        </h2>

        <p className="ba-timed-reminder-warning">
          {activeReminder.leadMinutes ===
          5
            ? "This callback is scheduled in 5 minutes."
            : "This callback is scheduled in 1 hour."}
        </p>

        <div className="ba-timed-reminder-details">
          <p>
            <FiClock />

            <span>
              {activeReminder.reminderDate}{" "}
              at{" "}
              {formatReminderTime(
                activeReminder.reminderTime
              )}
            </span>
          </p>

          <p>
            <FiPhone />

            <span>
              {activeReminder.contact ||
                "No contact number"}
            </span>
          </p>

          {activeReminder.mapLink && (
            <a
              href={
                activeReminder.mapLink
              }
              target="_blank"
              rel="noreferrer"
            >
              <FiMapPin />
              Open Map
            </a>
          )}
        </div>

        <div className="ba-timed-reminder-actions">
          <button
            type="button"
            className="ba-timed-reminder-close"
            onClick={closePopup}
          >
            Got It
          </button>

          <button
            type="button"
            className="ba-timed-reminder-open"
            onClick={
              handleGoToTmc
            }
          >
            Go to TMC
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaTimedReminderPopup;