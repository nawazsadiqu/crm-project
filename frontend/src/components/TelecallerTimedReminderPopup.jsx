import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiClock, FiMapPin, FiPhone } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../css/telecallerTimedReminderPopup.css";

const getTodayIST = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );

    return `${values.year}-${values.month}-${values.day}`;
};

// Supports database times in 24-hour HH:mm / HH:mm:ss or 12-hour h:mm AM/PM.
const parseTime = (timeValue) => {
    const match = String(timeValue || "")
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);

    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] || 0);
    const meridiem = match[4]?.toUpperCase();

    if (minutes > 59 || seconds > 59) return null;

    if (meridiem) {
        if (hours < 1 || hours > 12) return null;
        hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);
    } else if (hours > 23) {
        return null;
    }

    return { hours, minutes, seconds };
};

const getScheduledTime = (dateValue, timeValue) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ""))) {
        return Number.NaN;
    }

    const time = parseTime(timeValue);
    if (!time) return Number.NaN;

    const hh = String(time.hours).padStart(2, "0");
    const mm = String(time.minutes).padStart(2, "0");
    const ss = String(time.seconds).padStart(2, "0");

    return new Date(`${dateValue}T${hh}:${mm}:${ss}+05:30`).getTime();
};

const formatReminderTime = (value) => {
    const time = parseTime(value);
    if (!time) return value || "Time not set";

    const period = time.hours >= 12 ? "PM" : "AM";
    const displayHour = time.hours % 12 || 12;
    return `${displayHour}:${String(time.minutes).padStart(2, "0")} ${period}`;
};

const TelecallerTimedReminderPopup = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const employeeId = user?._id || user?.id || "unknown";

    const [activeReminder, setActiveReminder] = useState(null);
    const activeReminderRef = useRef(null);
    const latestReminderDataRef = useRef(null);
    const mountedRef = useRef(false);
    const nextCheckTimerRef = useRef(null);

    const getPopupStorageKey = (reminder) =>
        `tcTimedReminderShown-${employeeId}-${reminder.reminderDate}-${reminder.reminderId}-${reminder.reminderTime}`;

    const getClearedReminderIds = (dateValue) => {
        try {
            const saved = JSON.parse(
                localStorage.getItem(
                    `tcDashboardClearedReminders-${employeeId}-${dateValue}`
                ) || "[]"
            );
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    };

    const checkTimedReminders = (apiData) => {
        latestReminderDataRef.current = apiData;
        if (activeReminderRef.current || !mountedRef.current) return;

        const today = getTodayIST();
        if (apiData?.date && apiData.date !== today) return;

        const appointments = Array.isArray(apiData?.appointments)
            ? apiData.appointments
            : [];
        const callbackAppointments = Array.isArray(apiData?.callbackAppointments)
            ? apiData.callbackAppointments
            : [];
        const callbackPresentations = Array.isArray(apiData?.callbackPresentations)
            ? apiData.callbackPresentations
            : [];

        const timedReminders = [
            ...appointments.map((item) => ({
                ...item,
                reminderPageType: "appointment",
                reminderTypeLabel: "Fixed Appointment",
                reminderDate: item.appointmentDate,
                reminderTime: item.appointmentTime,
                leadMinutes: 60
            })),
            ...callbackAppointments.map((item) => ({
                ...item,
                reminderPageType: "callback",
                reminderTypeLabel: "Callback Appointment",
                reminderDate: item.callbackDate,
                reminderTime: item.callbackTime,
                leadMinutes: 60
            })),
            ...callbackPresentations.map((item) => ({
                ...item,
                reminderPageType: "callback-presentation",
                reminderTypeLabel: "Callback Presentation",
                reminderDate: item.callbackDate,
                reminderTime: item.callbackTime,
                leadMinutes: 5
            }))
        ];

        const clearedIds = getClearedReminderIds(today);
        const now = Date.now();
        const endOfToday = new Date(`${today}T23:59:59+05:30`).getTime();

        const dueReminder = timedReminders
            .filter((reminder) => {
                if (!reminder.reminderId || reminder.reminderDate !== today) {
                    return false;
                }

                // A cleared dashboard/list reminder should not also trigger a popup.
                if (clearedIds.includes(reminder.reminderId)) return false;

                const scheduled = getScheduledTime(
                    reminder.reminderDate,
                    reminder.reminderTime
                );
                if (!Number.isFinite(scheduled)) return false;

                if (localStorage.getItem(getPopupStorageKey(reminder)) === "1") {
                    return false;
                }

                const trigger = scheduled - reminder.leadMinutes * 60_000;
                return now >= trigger && now <= endOfToday;
            })
            .sort((a, b) =>
                getScheduledTime(a.reminderDate, a.reminderTime) -
                a.leadMinutes * 60_000 -
                (getScheduledTime(b.reminderDate, b.reminderTime) -
                    b.leadMinutes * 60_000)
            )[0];

        if (!dueReminder) return;
        activeReminderRef.current = dueReminder;
        setActiveReminder(dueReminder);
    };

    const fetchReminders = async () => {
        try {
            const { data } = await api.get("/telecaller-reminders/today");
            if (mountedRef.current) {
                checkTimedReminders(data || {});
            }
        } catch (error) {
            console.error("Telecaller timed reminder error:", error);
        }
    };

    useEffect(() => {
        // Never carry a previous employee's popup into a new login.
        activeReminderRef.current = null;
        latestReminderDataRef.current = null;
        setActiveReminder(null);
        mountedRef.current = true;
        fetchReminders();

        const timer = setInterval(fetchReminders, 30_000);
        const onVisibility = () => {
            if (document.visibilityState === "visible") fetchReminders();
        };
        const onFocus = () => fetchReminders();
        const onOnline = () => fetchReminders();
        const onReminderUpdate = () => fetchReminders();

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("focus", onFocus);
        window.addEventListener("online", onOnline);
        window.addEventListener("telecaller-reminders-updated", onReminderUpdate);

        return () => {
            mountedRef.current = false;
            clearInterval(timer);
            clearTimeout(nextCheckTimerRef.current);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("online", onOnline);
            window.removeEventListener("telecaller-reminders-updated", onReminderUpdate);
        };
        // This component stays mounted inside the Telecaller layout.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);

    const closePopup = () => {
        const reminder = activeReminderRef.current || activeReminder;
        if (reminder) {
            // Different employees have different acknowledgement keys.
            localStorage.setItem(getPopupStorageKey(reminder), "1");
        }

        activeReminderRef.current = null;
        setActiveReminder(null);

        // If more than one reminder is due, display the next one.
        clearTimeout(nextCheckTimerRef.current);
        nextCheckTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            if (latestReminderDataRef.current) {
                checkTimedReminders(latestReminderDataRef.current);
            } else {
                fetchReminders();
            }
        }, 100);
    };

    const getReminderWarning = (reminder) => {
        const scheduled = getScheduledTime(
            reminder.reminderDate,
            reminder.reminderTime
        );
        if (!Number.isFinite(scheduled)) return "Scheduled reminder";

        const isAppointment = reminder.reminderPageType === "appointment";
        const subject = isAppointment ? "appointment" : "callback";
        if (Date.now() > scheduled) {
            return `The scheduled ${subject} time has passed. Please follow up now.`;
        }

        const remainingMinutes = Math.max(
            1,
            Math.ceil((scheduled - Date.now()) / 60_000)
        );
        return `This ${subject} is scheduled in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"
            }.`;
    };

    const handleGoToTmc = () => {
        const reminder = activeReminderRef.current || activeReminder;
        if (!reminder) return;

        const business = {
            businessName: reminder.businessName || "",
            mapLink: reminder.mapLink || "",
            contactNumber: reminder.contact || ""
        };
        const returnTo = window.location.pathname;

        if (reminder.reminderPageType === "appointment") {
            navigate("/telecaller/tmc", {
                state: {
                    callingData: {
                        ...business,
                        mobileNumber: reminder.contact || "",
                        presentationId: reminder.id || ""
                    },
                    returnTo
                }
            });
        } else if (reminder.reminderPageType === "callback-presentation") {
            navigate("/telecaller/tmc", {
                state: { callbackPresentation: business, returnTo }
            });
        } else {
            navigate("/telecaller/tmc", {
                state: { callbackAppointment: business, returnTo }
            });
        }

        closePopup();
    };

    if (!activeReminder) return null;

    return (
        <div className="tc-timed-reminder-overlay">
            <div
                className="tc-timed-reminder-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tc-timed-reminder-title"
            >
                <div className="tc-timed-reminder-icon"><FiBell /></div>
                <span className="tc-timed-reminder-type">
                    {activeReminder.reminderTypeLabel}
                </span>
                <h2 id="tc-timed-reminder-title">
                    Reminder for {activeReminder.businessName || "Business"}
                </h2>
                <p className="tc-timed-reminder-warning">
                    {getReminderWarning(activeReminder)}
                </p>

                <div className="tc-timed-reminder-details">
                    <p>
                        <FiClock />
                        <span>
                            {activeReminder.reminderDate} at{" "}
                            {formatReminderTime(activeReminder.reminderTime)}
                        </span>
                    </p>
                    <p>
                        <FiPhone />
                        <span>{activeReminder.contact || "No contact number"}</span>
                    </p>
                    {activeReminder.mapLink && (
                        <a
                            href={activeReminder.mapLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FiMapPin /> Open Map
                        </a>
                    )}
                </div>

                <div className="tc-timed-reminder-actions">
                    <button
                        type="button"
                        className="tc-timed-reminder-close"
                        onClick={closePopup}
                    >
                        Got It
                    </button>
                    <button
                        type="button"
                        className="tc-timed-reminder-open"
                        onClick={handleGoToTmc}
                    >
                        Go to TMC
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TelecallerTimedReminderPopup;
