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

    const latestReminderDataRef =
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
  /*
    Store the latest API response so the
    next due reminder can be checked
    immediately after closing a popup.
  */
  latestReminderDataRef.current =
    apiData;

  /*
    Do not replace a popup that is
    already visible.
  */
  if (activeReminderRef.current) {
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

  /*
    End of the selected reminder day.

    An overdue reminder can still appear
    later on the same day instead of being
    permanently missed.
  */
  const endOfToday =
    new Date(
      `${today}T23:59:59+05:30`
    ).getTime();

  const dueReminder =
    timedReminders
      .filter((item) => {
        const scheduledTime =
          getScheduledTime(
            item.reminderDate,
            item.reminderTime
          );

        /*
          Reminders without time are shown
          only in the normal reminder list.
        */
        if (
          Number.isNaN(
            scheduledTime
          )
        ) {
          return false;
        }

        /*
          Do not display reminders from a
          different date.
        */
        if (
          item.reminderDate !== today
        ) {
          return false;
        }

        const triggerTime =
          scheduledTime -
          item.leadMinutes *
            60 *
            1000;

        const acknowledged =
          localStorage.getItem(
            getPopupStorageKey(
              item
            )
          ) === "1";

        return (
          !acknowledged &&
          now >= triggerTime &&
          now <= endOfToday
        );
      })
      .sort((first, second) => {
        const firstTrigger =
          getScheduledTime(
            first.reminderDate,
            first.reminderTime
          ) -
          first.leadMinutes *
            60 *
            1000;

        const secondTrigger =
          getScheduledTime(
            second.reminderDate,
            second.reminderTime
          ) -
          second.leadMinutes *
            60 *
            1000;

        return (
          firstTrigger -
          secondTrigger
        );
      })[0];

  if (!dueReminder) {
    return;
  }

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

      const safeData =
        data || {};

      latestReminderDataRef.current =
        safeData;

      checkTimedReminders(
        safeData
      );
    } catch (error) {
      console.error(
        "Timed reminder error:",
        error
      );
    }
  };

  useEffect(() => {
  /*
    Check immediately when the BA layout
    opens.
  */
  fetchReminders();

  /*
    Check every 30 seconds while the CRM
    is open.
  */
  const timer = setInterval(
    fetchReminders,
    30000
  );

  /*
    Browsers slow down timers when a tab
    is hidden. Check immediately when the
    tab becomes visible again.
  */
  const handleVisibilityChange =
    () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        fetchReminders();
      }
    };

  /*
    Check whenever the browser window
    receives focus again.
  */
  const handleWindowFocus =
    () => {
      fetchReminders();
    };

  /*
    Check after an internet connection
    becomes available again.
  */
  const handleOnline =
    () => {
      fetchReminders();
    };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  window.addEventListener(
    "focus",
    handleWindowFocus
  );

  window.addEventListener(
    "online",
    handleOnline
  );

  return () => {
    clearInterval(timer);

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.removeEventListener(
      "focus",
      handleWindowFocus
    );

    window.removeEventListener(
      "online",
      handleOnline
    );
  };
}, []);

  const closePopup = () => {
  const reminderToClose =
    activeReminderRef.current ||
    activeReminder;

  /*
    Mark as acknowledged only after
    the BA clicks Got It.
  */
  if (reminderToClose) {
    localStorage.setItem(
      getPopupStorageKey(
        reminderToClose
      ),
      "1"
    );
  }

  activeReminderRef.current =
    null;

  setActiveReminder(null);

  /*
    Immediately check whether another
    reminder is already due.
  */
  setTimeout(() => {
    if (
      latestReminderDataRef.current
    ) {
      checkTimedReminders(
        latestReminderDataRef.current
      );
    } else {
      fetchReminders();
    }
  }, 100);
};

  const getReminderWarning = (
  reminder
) => {
  const scheduledTime =
    getScheduledTime(
      reminder.reminderDate,
      reminder.reminderTime
    );

  if (
    Number.isNaN(
      scheduledTime
    )
  ) {
    return "Callback reminder";
  }

  const now = Date.now();

  if (now > scheduledTime) {
    return (
      "The scheduled callback time " +
      "has passed. Please follow up now."
    );
  }

  const remainingMinutes =
    Math.max(
      1,
      Math.ceil(
        (
          scheduledTime -
          now
        ) /
          60000
      )
    );

  return (
    `This callback is scheduled in ` +
    `${remainingMinutes} minute` +
    `${
      remainingMinutes === 1
        ? ""
        : "s"
    }.`
  );
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
  {getReminderWarning(
    activeReminder
  )}
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