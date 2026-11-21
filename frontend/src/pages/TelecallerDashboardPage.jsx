import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FiArrowRight,
    FiBell,
    FiCheckCircle,
    FiEdit3,
    FiFileText,
    FiPhoneCall,
    FiTarget,
    FiTrendingUp,
    FiX
} from "react-icons/fi";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../css/TelecallerDashboardPage.css";

const emptyMetrics = {
    calls: 0,
    presentations: 0,
    appointmentFixing: 0,
    forms: 0,
    revenue: 0
};

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

const numeric = (value) => Number(value || 0);

const getMotivationText = (percentage) => {
    if (percentage <= 0) return "Start now, every effort counts.";
    if (percentage < 40) return "Slow start, push harder today.";
    if (percentage < 60) return "Good start, keep improving.";
    if (percentage < 80) return "Strong progress, close the gap.";
    if (percentage < 100) return "Excellent work, almost there.";
    return "Goal completed, great job!";
};

const getProgressTheme = (percentage) => {
    if (percentage < 40) return { color: "#dc2626", end: "#fca5a5" };
    if (percentage < 60) return { color: "#f97316", end: "#fdba74" };
    if (percentage < 80) return { color: "#2563eb", end: "#7dd3fc" };
    return { color: "#16a34a", end: "#86efac" };
};

const progressPercent = (result, goal) =>
    numeric(goal) > 0
        ? Math.min((numeric(result) / numeric(goal)) * 100, 100)
        : 0;

const formatNumber = (number, money = false) =>
    `${money ? "₹" : ""}${numeric(number).toLocaleString("en-IN", {
        maximumFractionDigits: money ? 2 : 0
    })}`;

const formatReminderTime = (value) => {
    if (!value) return "Time not set";
    const [hh, mm = "00"] = String(value).split(":");
    const hour = Number(hh);
    const minute = Number(mm);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(value);
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const GoalDonutCard = ({ title, subtitle, value, goal, money = false }) => {
    const percentage = progressPercent(value, goal);
    const theme = getProgressTheme(percentage);
    const angle = (percentage / 100) * 360;

    return (
        <div className="tc-goal-donut-card">
            <div className="tc-section-head">
                <div>
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
            </div>

            <div className="tc-goal-donut-wrap">
                <div
                    className="tc-goal-donut"
                    style={{
                        background: `conic-gradient(${theme.color} 0deg, ${theme.end} ${angle}deg, #e5edf7 ${angle}deg 360deg)`
                    }}
                >
                    <div className="tc-goal-donut-inner">
                        <strong style={{ color: theme.color }}>{Math.round(percentage)}%</strong>
                        <span>Achieved</span>
                    </div>
                </div>
            </div>

            <div className="tc-goal-message" style={{ borderColor: theme.color }}>
                <span style={{ color: theme.color }}>{getMotivationText(percentage)}</span>
            </div>

            <div className="tc-goal-stats">
                <div className="tc-goal-stat-row">
                    <span>Result</span>
                    <strong>{formatNumber(value, money)}</strong>
                </div>
                <div className="tc-goal-stat-row">
                    <span>Goal</span>
                    <strong>{formatNumber(goal, money)}</strong>
                </div>
                <div className="tc-goal-stat-row">
                    <span>Remaining</span>
                    <strong>{formatNumber(Math.max(numeric(goal) - numeric(value), 0), money)}</strong>
                </div>
            </div>
        </div>
    );
};

const TelecallerDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [dailyGoals, setDailyGoals] = useState(emptyMetrics);
    const [dailyResults, setDailyResults] = useState(emptyMetrics);
    const [monthlyGoals, setMonthlyGoals] = useState(emptyMetrics);
    const [monthlyResults, setMonthlyResults] = useState(emptyMetrics);
    const [updatesUnreadCount, setUpdatesUnreadCount] = useState(0);
    const [reminderData, setReminderData] = useState({
        date: "",
        appointments: [],
        callbackAppointments: [],
        callbackPresentations: []
    });
    const [clearedReminderIds, setClearedReminderIds] = useState([]);
    const [showReminderPanel, setShowReminderPanel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [metricsError, setMetricsError] = useState("");

    const identity = user?._id || user?.id || "unknown";

    const reminderStorageKey = useCallback(
        (date) => `tcDashboardClearedReminders-${identity}-${date || getTodayIST()}`,
        [identity]
    );

    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);
            const date = getTodayIST();
            const monthDate = `${date.slice(0, 7)}-01`;

            // These are the SAME two responses used by TelecallerGoalsPage.
            const [dailyResponse, monthlyResponse] = await Promise.all([
                api.get("/goals", { params: { date, type: "daily" } }),
                api.get("/goals", { params: { date: monthDate, type: "monthly" } })
            ]);

            setDailyGoals({ ...emptyMetrics, ...(dailyResponse.data?.dailyGoals || {}) });
            setDailyResults({ ...emptyMetrics, ...(dailyResponse.data?.results || {}) });
            setMonthlyGoals({ ...emptyMetrics, ...(monthlyResponse.data?.monthlyGoals || {}) });
            setMonthlyResults({ ...emptyMetrics, ...(monthlyResponse.data?.monthlyResults || {}) });
            setMetricsError("");
        } catch (error) {
            console.error("Telecaller dashboard goals error:", error);
            setMetricsError(
                error.response?.data?.message || "Unable to load goal and result figures."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUpdates = useCallback(async () => {
        try {
            const { data } = await api.get("/telecaller-updates/unread-count");
            setUpdatesUnreadCount(numeric(data?.unreadCount));
        } catch (error) {
            console.error("Telecaller dashboard updates error:", error);
            setUpdatesUnreadCount(0);
        }
    }, []);

    const fetchReminders = useCallback(async () => {
        try {
            const { data } = await api.get("/telecaller-reminders/today");
            const date = data?.date || getTodayIST();
            setReminderData({
                date,
                appointments: Array.isArray(data?.appointments) ? data.appointments : [],
                callbackAppointments: Array.isArray(data?.callbackAppointments)
                    ? data.callbackAppointments : [],
                callbackPresentations: Array.isArray(data?.callbackPresentations)
                    ? data.callbackPresentations : []
            });
            let stored = [];
            try {
                const parsed = JSON.parse(localStorage.getItem(reminderStorageKey(date)) || "[]");
                stored = Array.isArray(parsed) ? parsed : [];
            } catch {
                stored = [];
            }
            setClearedReminderIds(stored);
        } catch (error) {
            console.error("Telecaller dashboard reminders error:", error);
            setReminderData({
                date: getTodayIST(),
                appointments: [], callbackAppointments: [], callbackPresentations: []
            });
        }
    }, [reminderStorageKey]);

    useEffect(() => {
        fetchMetrics();
        fetchUpdates();
        fetchReminders();

        const interval = setInterval(() => {
            fetchMetrics();
            fetchUpdates();
            fetchReminders();
        }, 60000);

        const reminderUpdate = () => fetchReminders();
        window.addEventListener("telecaller-reminders-updated", reminderUpdate);
        return () => {
            clearInterval(interval);
            window.removeEventListener("telecaller-reminders-updated", reminderUpdate);
        };
    }, [fetchMetrics, fetchUpdates, fetchReminders]);

    const allReminders = useMemo(() => [
        ...reminderData.appointments.map((item) => ({
            ...item,
            reminderPageType: "appointment",
            reminderTypeLabel: "Fixed Appointment",
            reminderDateLabel: item.appointmentDate,
            reminderTimeLabel: item.appointmentTime
        })),
        ...reminderData.callbackAppointments.map((item) => ({
            ...item,
            reminderPageType: "callback",
            reminderTypeLabel: "Callback Appointment",
            reminderDateLabel: item.callbackDate,
            reminderTimeLabel: item.callbackTime
        })),
        ...reminderData.callbackPresentations.map((item) => ({
            ...item,
            reminderPageType: "callback-presentation",
            reminderTypeLabel: "Callback Presentation",
            reminderDateLabel: item.callbackDate,
            reminderTimeLabel: item.callbackTime
        }))
    ], [reminderData]);

    const visibleReminders = allReminders.filter(
        (item) => !clearedReminderIds.includes(item.reminderId)
    );

    const clearReminder = (reminderId) => {
        const next = Array.from(new Set([...clearedReminderIds, reminderId]));
        localStorage.setItem(reminderStorageKey(reminderData.date), JSON.stringify(next));
        setClearedReminderIds(next);
        window.dispatchEvent(new Event("telecaller-reminders-updated"));
    };

    const clearAllReminders = () => {
        const allIds = allReminders.map((item) => item.reminderId);
        localStorage.setItem(reminderStorageKey(reminderData.date), JSON.stringify(allIds));
        setClearedReminderIds(allIds);
        window.dispatchEvent(new Event("telecaller-reminders-updated"));
    };

    const goToTmc = (item) => {
        setShowReminderPanel(false);
        const details = {
            businessName: item.businessName || "",
            mapLink: item.mapLink || "",
            contactNumber: item.contact || ""
        };

        const state = { returnTo: "/telecaller" };
        if (item.reminderPageType === "appointment") {
            state.callingData = { ...details, mobileNumber: item.contact || "" };
        } else if (item.reminderPageType === "callback-presentation") {
            state.callbackPresentation = details;
        } else {
            state.callbackAppointment = details;
        }
        navigate("/telecaller/tmc", { state });
    };

    const openOriginalRecord = (item) => {
        const destination = {
            appointment: "/telecaller/appointments",
            callback: "/telecaller/callback-appointments",
            "callback-presentation": "/telecaller/data-sheet/callback-presentations"
        }[item.reminderPageType];

        if (!destination) return;
        setShowReminderPanel(false);
        navigate(destination, {
            state: {
                fromReminders: true,
                reminderTarget: {
                    type: item.reminderPageType,
                    recordId: String(item.id || ""),
                    logId: String(item.logId || ""),
                    callNumber: item.callNumber ?? null,
                    businessName: item.businessName || "",
                    contact: item.contact || "",
                    reminderDate: item.reminderDateLabel || "",
                    reminderTime: item.reminderTimeLabel || ""
                },
                returnTo: "/telecaller"
            }
        });
    };

    const dateDisplay = new Date().toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata", weekday: "long", day: "2-digit", month: "short", year: "numeric"
    });
    const istHour = Number(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23"
    }).format(new Date()));
    const greeting = istHour < 12 ? "Good Morning" : istHour < 17 ? "Good Afternoon" : "Good Evening";

    const progressItems = [
        { label: "Daily Presentations", icon: <FiFileText />, key: "presentations" },
        { label: "Daily Appointment Fixing", icon: <FiCheckCircle />, key: "appointmentFixing" },
        { label: "Daily Forms", icon: <FiEdit3 />, key: "forms" }
    ];

    return (
        <div className="tc-dashboard-page">
            <section className="tc-dashboard-hero-minimal">
                <div className="tc-dashboard-hero-left">
                    <span className="tc-dashboard-date-pill">{dateDisplay.toUpperCase()}</span>
                    <h2>{greeting}, {user?.name || "Telecaller"}</h2>
                    <p>Track your calls, appointment fixing, forms and daily progress in one place.</p>
                </div>

                <div className="tc-dashboard-hero-actions">
                    <div className="tc-reminder-wrap">
                        <button
                            type="button"
                            className="tc-reminder-bell"
                            onClick={() => setShowReminderPanel((open) => !open)}
                            aria-label={`Today's reminders: ${visibleReminders.length}`}
                            aria-expanded={showReminderPanel}
                        >
                            <FiBell />
                            {visibleReminders.length > 0 && (
                                <span className="tc-reminder-count">{visibleReminders.length}</span>
                            )}
                        </button>

                        {showReminderPanel && (
                            <div className="tc-reminder-panel">
                                <div className="tc-reminder-panel-head">
                                    <div>
                                        <strong>Today's Reminders</strong>
                                        <span>{reminderData.date || getTodayIST()}</span>
                                    </div>
                                    <div className="tc-reminder-head-actions">
                                        <Link to="/telecaller/reminders" onClick={() => setShowReminderPanel(false)}>
                                            View All
                                        </Link>
                                        <button
                                            type="button"
                                            aria-label="Close reminder panel"
                                            onClick={() => setShowReminderPanel(false)}
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>

                                {visibleReminders.length === 0 ? (
                                    <p className="tc-reminder-empty">No active reminders for today.</p>
                                ) : (
                                    <>
                                        <div className="tc-reminder-list">
                                            {visibleReminders.map((item) => (
                                                <div key={item.reminderId} className={`tc-reminder-item ${item.reminderPageType}`}>
                                                    <div className="tc-reminder-content">
                                                        <span className="tc-reminder-type">{item.reminderTypeLabel}</span>
                                                        <strong>{item.businessName || "-"}</strong>
                                                        <p>{item.status || "-"}</p>
                                                        <p>Date: {item.reminderDateLabel || "-"}</p>
                                                        <p>Time: {formatReminderTime(item.reminderTimeLabel)}</p>
                                                        <p>Contact: {item.contact || "-"}</p>
                                                    </div>
                                                    <div className="tc-reminder-actions">
                                                        <button type="button" onClick={() => goToTmc(item)}>
                                                            <FiPhoneCall /> TMC
                                                        </button>
                                                        <button type="button" onClick={() => openOriginalRecord(item)}>
                                                            <FiEdit3 /> Edit / Notes
                                                        </button>
                                                        <button type="button" className="tc-reminder-clear-btn" onClick={() => clearReminder(item.reminderId)}>
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" className="tc-reminder-clear-all" onClick={clearAllReminders}>
                                            Clear All
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <Link to="/telecaller/tmc" className="tc-dashboard-start-btn">
                        Start Working <FiArrowRight />
                    </Link>
                </div>
            </section>

            {metricsError && <p className="tc-dashboard-error" role="alert">{metricsError}</p>}

            <section className="tc-dashboard-summary-grid">
                <Link to="/telecaller/updates" className="tc-summary-card">
                    <span className="tc-summary-icon"><FiBell /></span>
                    <div><span>Unread Updates</span><h3>{updatesUnreadCount}</h3><p>Business updates pending</p></div>
                </Link>
                <Link to="/telecaller/tmc" className="tc-summary-card">
                    <span className="tc-summary-icon"><FiPhoneCall /></span>
                    <div><span>Today's Calling</span><h3>TMC</h3><p>Update calls and statuses</p></div>
                </Link>
                <Link to="/telecaller/forms" className="tc-summary-card">
                    <span className="tc-summary-icon"><FiEdit3 /></span>
                    <div><span>Business Forms</span><h3>Forms</h3><p>{formatNumber(monthlyResults.forms)} / {formatNumber(monthlyGoals.forms)} this month</p></div>
                </Link>
                <Link to="/telecaller/goals" className="tc-summary-card">
                    <span className="tc-summary-icon"><FiTarget /></span>
                    <div><span>Goals & Results</span><h3>Track</h3><p>Check your target progress</p></div>
                </Link>
            </section>

            <section className="tc-dashboard-analytics-grid" aria-busy={loading}>
                <div className="tc-progress-overview-card">
                    <div className="tc-section-head">
                        <div><h3>Goal Progress Overview</h3><p>Today's Telecaller performance at a glance</p></div>
                    </div>

                    <div className="tc-progress-list">
                        {progressItems.map(({ key, label, icon }) => {
                            const percent = progressPercent(dailyResults[key], dailyGoals[key]);
                            const theme = getProgressTheme(percent);
                            return (
                                <div className="tc-progress-block" key={key}>
                                    <div className="tc-progress-top">
                                        <div className="tc-progress-title-wrap">
                                            {icon}
                                            <div>
                                                <strong>{label}</strong>
                                                <span>{formatNumber(dailyResults[key])} / {formatNumber(dailyGoals[key])}</span>
                                            </div>
                                        </div>
                                        <b style={{ color: theme.color }}>{Math.round(percent)}%</b>
                                    </div>
                                    <div className="tc-progress-bar">
                                        <div className="tc-progress-fill" style={{
                                            width: `${percent}%`,
                                            background: `linear-gradient(90deg, ${theme.color}, ${theme.end})`
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="tc-insight-strip">
                        <FiTrendingUp />
                        <span>Consistent calling and presentations help improve appointment fixing, forms and revenue.</span>
                    </div>
                </div>

                <GoalDonutCard
                    title="Daily Call Goal vs Result"
                    subtitle="Today's calling performance"
                    value={dailyResults.calls}
                    goal={dailyGoals.calls}
                />
                <GoalDonutCard
                    title="Monthly Revenue Goal vs Result"
                    subtitle="Current month revenue comparison"
                    value={monthlyResults.revenue}
                    goal={monthlyGoals.revenue}
                    money
                />
            </section>
        </div>
    );
};

export default TelecallerDashboardPage;
