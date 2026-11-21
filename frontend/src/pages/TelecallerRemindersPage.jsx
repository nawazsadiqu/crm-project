import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiEdit3, FiMapPin, FiPhone, FiTrash2 } from "react-icons/fi";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../css/telecallerReminders.css";

const TelecallerRemindersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [reminderData, setReminderData] = useState({
        date: "",
        appointments: [],
        callbackAppointments: [],
        callbackPresentations: []
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
        return `tcDashboardClearedReminders-${user?._id || user?.id || "unknown"}-${dateValue || getTodayIST()}`;
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

            const { data } = await api.get("/telecaller-reminders/today");

            const reminderDate = data.date || getTodayIST();

            setReminderData({
                date: reminderDate,

                appointments: Array.isArray(data.appointments)
                    ? data.appointments
                    : [],

                callbackAppointments: Array.isArray(data.callbackAppointments)
                    ? data.callbackAppointments
                    : [],

                callbackPresentations: Array.isArray(data.callbackPresentations)
                    ? data.callbackPresentations
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
                callbackAppointments: [],
                callbackPresentations: []
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

    const formatReminderTime = (
        timeValue
    ) => {
        if (!timeValue) {
            return "Time not set";
        }

        const [
            hourValue,
            minuteValue
        ] = String(timeValue).split(":");

        const hour = Number(hourValue);
        const minute =
            minuteValue || "00";

        if (Number.isNaN(hour)) {
            return timeValue;
        }

        const period =
            hour >= 12 ? "PM" : "AM";

        const displayHour =
            hour % 12 || 12;

        return `${displayHour}:${minute} ${period}`;
    };

    const allTodayReminders = [
        ...reminderData.appointments.map(
            (item) => ({
                ...item,

                reminderTypeLabel:
                    "Fixed Appointment",

                reminderDateLabel:
                    item.appointmentDate,

                reminderTimeLabel:
                    item.appointmentTime,

                reminderPageType:
                    "appointment"
            })
        ),

        ...reminderData.callbackAppointments.map(
            (item) => ({
                ...item,

                reminderTypeLabel:
                    "Callback Appointment",

                reminderDateLabel:
                    item.callbackDate,

                reminderTimeLabel:
                    item.callbackTime,

                reminderPageType:
                    "callback"
            })
        ),

        ...reminderData.callbackPresentations.map(
            (item) => ({
                ...item,

                reminderTypeLabel:
                    "Callback Presentation",

                reminderDateLabel:
                    item.callbackDate,

                reminderTimeLabel:
                    item.callbackTime,

                reminderPageType:
                    "callback-presentation"
            })
        )
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

    const callbackPresentationCount =
        visibleTodayReminders.filter(
            (item) =>
                item.reminderPageType ===
                "callback-presentation"
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
        window.dispatchEvent(
            new Event("telecaller-reminders-updated")
        );
    };

    const handleClearAllReminders = () => {
        const allIds = allTodayReminders.map(
            (item) => item.reminderId
        );

        localStorage.setItem(
            getReminderStorageKey(reminderData.date),
            JSON.stringify(allIds)
        );

        setClearedReminderIds(allIds);

        window.dispatchEvent(
            new Event("telecaller-reminders-updated")
        );
    };

    const handleReminderGoToTmc = (item) => {
        if (item.reminderPageType === "appointment") {
            navigate("/telecaller/tmc", {
                state: {
                    callingData: {
                        businessName: item.businessName || "",
                        mapLink: item.mapLink || "",
                        contactNumber: item.contact || "",
                        mobileNumber: item.contact || ""
                    },
                    returnTo: "/telecaller/reminders"
                }
            });

            return;
        }

        if (item.reminderPageType === "callback-presentation") {
            navigate("/telecaller/tmc", {
                state: {
                    callbackPresentation: {
                        businessName: item.businessName || "",
                        mapLink: item.mapLink || "",
                        contactNumber: item.contact || ""
                    },
                    returnTo: "/telecaller/reminders"
                }
            });

            return;
        }

        navigate("/telecaller/tmc", {
            state: {
                callbackAppointment: {
                    businessName: item.businessName || "",
                    mapLink: item.mapLink || "",
                    contactNumber: item.contact || ""
                },
                returnTo: "/telecaller/reminders"
            }
        });
    };


    // Open the original record from today's reminder card.
    // The receiving pages use these IDs to highlight and focus the exact item.
    const handleOpenOriginalRecord = (item) => {
        const destinationMap = {
            appointment: "/telecaller/appointments",
            callback: "/telecaller/callback-appointments",
            "callback-presentation":
                "/telecaller/data-sheet/callback-presentations"
        };

        const destination = destinationMap[item.reminderPageType];
        if (!destination) return;

        navigate(destination, {
            state: {
                fromReminders: true,
                reminderTarget: {
                    type: item.reminderPageType,
                    recordId:
                        item.reminderPageType === "callback-presentation"
                            ? ""
                            : String(item.id || ""),
                    logId: String(item.logId || ""),
                    callNumber: item.callNumber ?? null,
                    businessName: item.businessName || "",
                    contact: item.contact || "",
                    reminderDate: item.reminderDateLabel || "",
                    reminderTime: item.reminderTimeLabel || ""
                },
                returnTo: "/telecaller/reminders"
            }
        });
    };

    return (
        <div className="tc-reminders-page">
            <div className="tc-reminders-card">
                <div className="tc-reminders-header">
                    <div>
                        <h2 className="tc-reminders-title">Today&apos;s Reminders</h2>
                        <p className="tc-reminders-subtitle">
                            View today&apos;s fixed appointments and callbacks
                        </p>
                    </div>

                    <div className="tc-reminders-header-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={fetchTodayReminders}
                        >
                            Refresh
                        </button>

                        <Link to="/telecaller" className="btn btn-secondary">
                            Back
                        </Link>
                    </div>
                </div>

                {message && <p className="tc-reminders-message">{message}</p>}

                <div className="tc-reminders-summary-grid">
                    <div className="tc-reminders-summary-box">
                        <span>Total Reminders</span>
                        <strong>{visibleTodayReminders.length}</strong>
                        <p>{reminderData.date || getTodayIST()}</p>
                    </div>

                    <div className="tc-reminders-summary-box appointment">
                        <span>Appointments</span>
                        <strong>{appointmentCount}</strong>
                        <p>Appointment scheduled for today</p>
                    </div>

                    <div className="tc-reminders-summary-box callback">
                        <span>Callbacks</span>
                        <strong>{callbackCount}</strong>
                        <p>Callback date is today</p>
                    </div>
                    <div className="tc-reminders-summary-box callback">
                        <span>Callback Presentations</span>

                        <strong>
                            {callbackPresentationCount}
                        </strong>

                        <p>Presentation callback date is today</p>
                    </div>
                </div>

                <div className="tc-reminders-toolbar">
                    <div>
                        <h3>Reminder List</h3>
                        <p>Click any card to open TMC with details</p>
                    </div>

                    {visibleTodayReminders.length > 0 && (
                        <button
                            type="button"
                            className="tc-reminders-clear-all-btn"
                            onClick={handleClearAllReminders}
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {loading ? (
                    <p className="tc-reminders-empty">Loading reminders...</p>
                ) : visibleTodayReminders.length === 0 ? (
                    <p className="tc-reminders-empty">
                        No appointments, callback appointments or callback presentations for today.
                    </p>
                ) : (
                    <div className="tc-reminders-list">
                        {visibleTodayReminders.map((item) => (
                            <div
                                key={item.reminderId}
                                className={`tc-reminders-item ${item.reminderPageType}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleReminderGoToTmc(item)}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        e.target === e.currentTarget
                                    ) {
                                        handleReminderGoToTmc(item);
                                    }
                                }}
                            >
                                <div className="tc-reminders-item-main">
                                    <span className="tc-reminders-type-pill">
                                        <FiBell />
                                        {item.reminderTypeLabel}
                                    </span>

                                    <h4>{item.businessName || "-"}</h4>

                                    <div className="tc-reminders-meta-grid">
                                        <p>
                                            <strong>Status:</strong> {item.status || "-"}
                                        </p>

                                        <p>
                                            <strong>Date:</strong>{" "} {item.reminderDateLabel || "-"}
                                        </p>

                                        <p>
                                            <strong>Time:</strong>{" "} {formatReminderTime(item.reminderTimeLabel)}
                                        </p>

                                        <p>
                                            <FiPhone /> {item.contact || "-"}
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

                                <div className="tc-reminders-item-actions">
                                    <button
                                        type="button"
                                        className="tc-reminders-edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenOriginalRecord(item);
                                        }}
                                    >
                                        <FiEdit3 />
                                        Edit / Notes
                                    </button>

                                    <button
                                        type="button"
                                        className="tc-reminders-clear-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearReminder(item.reminderId);
                                        }}
                                    >
                                        <FiTrash2 />
                                        Clear
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelecallerRemindersPage;