import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TelecallerTimedReminderPopup from "../components/TelecallerTimedReminderPopup";
import api from "../services/api";
import {
    FiGrid,
    FiTarget,
    FiPhoneCall,
    FiDatabase,
    FiList,
    FiBriefcase,
    FiFileText,
    FiRefreshCw,
    FiMenu,
    FiX,
    FiBell,
    FiUser
} from "react-icons/fi";
import "../css/TelecallerLayout.css";
import "../css/telecallerLayoutNotifications.css";

const getTodayIST = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${date.year}-${date.month}-${date.day}`;
};

const TelecallerLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [updatesUnreadCount, setUpdatesUnreadCount] = useState(0);
    const [reminderCount, setReminderCount] = useState(0);

    // Must match the reminder list, dashboard and timed-popup storage key.
    const employeeId = user?._id || user?.id || "unknown";

    const navItems = [
        { label: "Dashboard", path: "/telecaller", icon: <FiGrid /> },
        { label: "Goals & Results", path: "/telecaller/goals", icon: <FiTarget /> },
        { label: "TMC", path: "/telecaller/tmc", icon: <FiPhoneCall /> },
        { label: "Data Sheet", path: "/telecaller/data-sheet", icon: <FiDatabase /> },
        { label: "Forms", path: "/telecaller/forms", icon: <FiFileText /> },
        { label: "Closed Deals", path: "/telecaller/closed-deals", icon: <FiBriefcase /> },
        { label: "Updates", path: "/telecaller/updates", icon: <FiRefreshCw /> },
        { label: "Reminders", path: "/telecaller/reminders", icon: <FiBell /> },
        { label: "Calling Data", path: "/telecaller/calling-data", icon: <FiList /> },
        { label: "My Profile", path: "/telecaller/my-profile", icon: <FiUser /> }
    ];

    const isActive = (path) => {
        if (path === "/telecaller") {
            return location.pathname === "/telecaller";
        }
        return location.pathname.startsWith(path);
    };

    const closeSidebar = () => setSidebarOpen(false);
    const toggleSidebar = () => setSidebarOpen((previous) => !previous);

    const fetchUpdatesUnreadCount = useCallback(async () => {
        try {
            const { data } = await api.get("/telecaller-updates/unread-count");
            setUpdatesUnreadCount(Math.max(0, Number(data?.unreadCount) || 0));
        } catch (error) {
            console.error("Telecaller updates badge error:", error);
            setUpdatesUnreadCount(0);
        }
    }, []);

    const fetchReminderCount = useCallback(async () => {
        try {
            const { data } = await api.get("/telecaller-reminders/today");
            const today = getTodayIST();
            const reminderDate = data?.date || today;

            // Never show yesterday's items if an API response crosses midnight.
            if (reminderDate !== today) {
                setReminderCount(0);
                return;
            }

            const allReminders = [
                ...(Array.isArray(data?.appointments) ? data.appointments : []),
                ...(Array.isArray(data?.callbackAppointments) ? data.callbackAppointments : []),
                ...(Array.isArray(data?.callbackPresentations) ? data.callbackPresentations : [])
            ];

            let clearedIds = [];
            try {
                const key = `tcDashboardClearedReminders-${employeeId}-${reminderDate}`;
                const saved = JSON.parse(localStorage.getItem(key) || "[]");
                clearedIds = Array.isArray(saved) ? saved : [];
            } catch {
                clearedIds = [];
            }

            setReminderCount(
                allReminders.filter((item) =>
                    item.reminderId && !clearedIds.includes(item.reminderId)
                ).length
            );
        } catch (error) {
            console.error("Telecaller reminders badge error:", error);
            setReminderCount(0);
        }
    }, [employeeId]);

    // Refresh on navigation, including returning from Updates or Reminders.
    useEffect(() => {
        closeSidebar();
        fetchUpdatesUnreadCount();
        fetchReminderCount();
    }, [location.pathname, fetchUpdatesUnreadCount, fetchReminderCount]);

    // Keep badges live even if the employee stays on the same page.
    useEffect(() => {
        const refreshBoth = () => {
            fetchUpdatesUnreadCount();
            fetchReminderCount();
        };

        const refreshReminders = () => fetchReminderCount();
        const refreshUpdates = () => fetchUpdatesUnreadCount();
        const onVisible = () => {
            if (document.visibilityState === "visible") refreshBoth();
        };
        const onStorage = (event) => {
            if (
                event.key?.startsWith(`tcDashboardClearedReminders-${employeeId}-`)
            ) {
                refreshReminders();
            }
        };

        const timer = setInterval(refreshBoth, 60000);

        window.addEventListener("focus", refreshBoth);
        window.addEventListener("online", refreshBoth);
        window.addEventListener("storage", onStorage);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("telecaller-reminders-updated", refreshReminders);
        window.addEventListener("telecaller-updates-updated", refreshUpdates);

        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", refreshBoth);
            window.removeEventListener("online", refreshBoth);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("telecaller-reminders-updated", refreshReminders);
            window.removeEventListener("telecaller-updates-updated", refreshUpdates);
        };
    }, [employeeId, fetchUpdatesUnreadCount, fetchReminderCount]);

    return (
        <div className="frontend-layout">
            {/* MOBILE TOP BAR */}
            <div className="frontend-mobile-topbar">
                <h2 className="frontend-mobile-brand">CTS CONEXA</h2>
                <button
                    type="button"
                    className="frontend-menu-toggle"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                    aria-expanded={sidebarOpen}
                >
                    {sidebarOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <div className="frontend-sidebar-overlay" onClick={closeSidebar} />
            )}

            {/* SIDEBAR */}
            <aside className={`frontend-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div>
                    <div className="frontend-sidebar-top">
                        <div className="frontend-logo-box">
                            <h2>CTS CONEXA</h2>
                            <p>Telecaller Panel</p>
                        </div>
                    </div>

                    <nav className="frontend-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeSidebar}
                                className={`frontend-nav-item ${isActive(item.path) ? "active" : ""}`}
                            >
                                <span className="frontend-nav-icon">{item.icon}</span>
                                <span className="frontend-nav-text">
                                    {item.label}

                                    {item.path === "/telecaller/updates" && updatesUnreadCount > 0 && (
                                        <span
                                            className="tc-layout-notification-badge"
                                            aria-label={`${updatesUnreadCount} unread updates`}
                                        >
                                            {updatesUnreadCount}
                                        </span>
                                    )}

                                    {item.path === "/telecaller/reminders" && reminderCount > 0 && (
                                        <span
                                            className="tc-layout-notification-badge"
                                            aria-label={`${reminderCount} active reminders`}
                                        >
                                            {reminderCount}
                                        </span>
                                    )}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="frontend-main">
                <header className="frontend-header">
                    <div>
                        <h1 className="frontend-page-title">Telecaller Section</h1>
                        <p className="frontend-page-subtitle">
                            Welcome back, {user?.name || "Telecaller"}
                        </p>
                    </div>

                    {/* Profile link works independently of whether HR filled employee details. */}
                    <Link
                        to="/telecaller/my-profile"
                        className="frontend-user-box tc-layout-profile-link"
                    >
                        <div className="frontend-user-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div>
                            <h3>{user?.name || "Telecaller"}</h3>
                            <p>TELECALLER</p>
                        </div>
                    </Link>
                </header>

                <div className="frontend-content-area">
                    <Outlet />
                </div>
            </div>

            {/* Remains active on every Telecaller page. */}
            <TelecallerTimedReminderPopup />
        </div>
    );
};

export default TelecallerLayout;
