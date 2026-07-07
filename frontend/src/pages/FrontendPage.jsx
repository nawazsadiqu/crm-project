import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBell,
  FiEdit,
  FiPhoneCall,
  FiTarget,
  FiTrendingUp,
  FiFileText,
  FiCheckCircle
} from "react-icons/fi";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const getMotivationText = (percent) => {
  if (percent <= 0) {
    return "Start now, every effort counts.";
  }

  if (percent < 40) {
    return "Slow start, push harder today.";
  }

  if (percent < 60) {
    return "Good start, keep improving.";
  }

  if (percent < 80) {
    return "Strong progress, close the gap.";
  }

  if (percent < 100) {
    return "Excellent work, almost there.";
  }

  return "Goal completed, great job!";
};

const GoalDonutCard = ({
  title,
  subtitle,
  value,
  goal,
  prefix = "",
  suffix = ""
}) => {
  const safeValue = Number(value || 0);
  const safeGoal = Number(goal || 0);

  const percentage =
    safeGoal > 0 ? Math.min((safeValue / safeGoal) * 100, 100) : 0;

  const progressAngle = (percentage / 100) * 360;

  const getProgressGradient = (percent) => {
  if (percent < 40) {
    return {
      start: "#dc2626",
      end: "#fca5a5"
    };
  }

  if (percent < 60) {
    return {
      start: "#f97316",
      end: "#fdba74"
    };
  }

  if (percent < 80) {
    return {
      start: "#2563eb",
      end: "#7dd3fc"
    };
  }

  return {
    start: "#16a34a",
    end: "#86efac"
  };
};

  const gradient = getProgressGradient(percentage);

  const motivationText = getMotivationText(percentage);

  const donutStyle = {
    background: `conic-gradient(
      ${gradient.start} 0deg,
      ${gradient.end} ${progressAngle}deg,
      #e5edf7 ${progressAngle}deg,
      #e5edf7 360deg
    )`
  };

  return (
    <div className="ba-goal-donut-card">
      <div className="ba-section-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="ba-goal-donut-wrap">
        <div className="ba-goal-donut" style={donutStyle}>
          <div className="ba-goal-donut-inner">
            <strong style={{ color: gradient.start }}>
              {Math.round(percentage)}%
            </strong>
            <span>Achieved</span>
          </div>
        </div>
      </div>

      <div className="ba-goal-message" style={{ borderColor: gradient.start }}>
  <span style={{ color: gradient.start }}>{motivationText}</span>
</div>

      <div className="ba-goal-stats">
        <div className="ba-goal-stat-row">
          <span>Result</span>
          <strong>
            {prefix}
            {safeValue.toLocaleString("en-IN")}
            {suffix}
          </strong>
        </div>

        <div className="ba-goal-stat-row">
          <span>Goal</span>
          <strong>
            {prefix}
            {safeGoal.toLocaleString("en-IN")}
            {suffix}
          </strong>
        </div>

        <div className="ba-goal-stat-row">
          <span>Remaining</span>
          <strong>
            {prefix}
            {Math.max(safeGoal - safeValue, 0).toLocaleString("en-IN")}
            {suffix}
          </strong>
        </div>
      </div>
    </div>
  );
};

const getProgressTheme = (percent) => {
  if (percent < 40) {
    return {
      color: "#dc2626",
      bar: "linear-gradient(90deg, #dc2626, #fecaca)"
    };
  }

  if (percent < 60) {
    return {
      color: "#f97316",
      bar: "linear-gradient(90deg, #f97316, #fed7aa)"
    };
  }

  if (percent < 80) {
    return {
      color: "#2563eb",
      bar: "linear-gradient(90deg, #2563eb, #bfdbfe)"
    };
  }

  return {
    color: "#16a34a",
    bar: "linear-gradient(90deg, #16a34a, #bbf7d0)"
  };
};

const FrontendPage = () => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const [updatesUnreadCount, setUpdatesUnreadCount] = useState(0);

  const [dashboardData, setDashboardData] = useState({
  goals: {
    dailyCallGoal: 0,
    dailyPresentationGoal: 0,
    dailyAppointmentGoal: 0,
    dailyFormsGoal: 0,
    monthlyFormsGoal: 0,
    monthlyRevenueGoal: 0
  },
  results: {
    dailyCalls: 0,
    dailyPresentations: 0,
    dailyAppointments: 0,
    dailyForms: 0,
    monthlyForms: 0,
    monthlyRevenue: 0
  }
});

const [reminderData, setReminderData] = useState({
  date: "",
  appointments: [],
  callbackAppointments: []
});

const [showReminderPanel, setShowReminderPanel] = useState(false);
const [clearedReminderIds, setClearedReminderIds] = useState([]);

  useEffect(() => {
  const fetchUnread = async () => {
    try {
      const { data } = await api.get("/ba-updates/unread-count");
      setUpdatesUnreadCount(Number(data.unreadCount || 0));
    } catch {
      setUpdatesUnreadCount(0);
    }
  };

  

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get("/ba-dashboard/summary");

      setDashboardData({
        goals: data.goals || {},
        results: data.results || {}
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
    }
  };

  fetchUnread();
  fetchDashboardData();
}, []);

useEffect(() => {
  fetchTodayReminders();

  const reminderTimer = setInterval(() => {
    fetchTodayReminders();
  }, 60000);

  return () => clearInterval(reminderTimer);
}, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const dailyCallGoal = Number(dashboardData.goals.dailyCallGoal || 0);
  const dailyCallResult = Number(dashboardData.results.dailyCalls || 0);

const dailyPresentationGoal = Number(
  dashboardData.goals.dailyPresentationGoal || 0
);
const dailyPresentationResult = Number(
  dashboardData.results.dailyPresentations || 0
);

const dailyAppointmentGoal = Number(
  dashboardData.goals.dailyAppointmentGoal || 0
);
const dailyAppointmentResult = Number(
  dashboardData.results.dailyAppointments || 0
);

const dailyFormsGoal = Number(dashboardData.goals.dailyFormsGoal || 0);
const dailyFormsResult = Number(dashboardData.results.dailyForms || 0);

const monthlyFormsGoal = Number(dashboardData.goals.monthlyFormsGoal || 0);
const monthlyFormsResult = Number(dashboardData.results.monthlyForms || 0);

const monthlyRevenueGoal = Number(
  dashboardData.goals.monthlyRevenueGoal || 0
);
const monthlyRevenueResult = Number(
  dashboardData.results.monthlyRevenue || 0
);

  const presentationProgress = useMemo(() => {
  return dailyPresentationGoal > 0
    ? Math.min((dailyPresentationResult / dailyPresentationGoal) * 100, 100)
    : 0;
}, [dailyPresentationGoal, dailyPresentationResult]);

const appointmentProgress = useMemo(() => {
  return dailyAppointmentGoal > 0
    ? Math.min((dailyAppointmentResult / dailyAppointmentGoal) * 100, 100)
    : 0;
}, [dailyAppointmentGoal, dailyAppointmentResult]);

const formsProgress = useMemo(() => {
  return dailyFormsGoal > 0
    ? Math.min((dailyFormsResult / dailyFormsGoal) * 100, 100)
    : 0;
}, [dailyFormsGoal, dailyFormsResult]);

const presentationTheme = getProgressTheme(presentationProgress);
const appointmentTheme = getProgressTheme(appointmentProgress);
const formsTheme = getProgressTheme(formsProgress);

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
    const { data } = await api.get("/ba-reminders/today");

    const reminderDate = data.date || getTodayIST();

    setReminderData({
      date: reminderDate,
      appointments: Array.isArray(data.appointments) ? data.appointments : [],
      callbackAppointments: Array.isArray(data.callbackAppointments)
        ? data.callbackAppointments
        : []
    });

    setClearedReminderIds(getStoredClearedReminderIds(reminderDate));
  } catch (error) {
    console.error("Reminder fetch error:", error);
    setReminderData({
      date: getTodayIST(),
      appointments: [],
      callbackAppointments: []
    });
  }
};

const allTodayReminders = [
  ...reminderData.appointments.map((item) => ({
    ...item,
    reminderTypeLabel: "Appointment",
    reminderDateLabel: item.appointmentDate
  })),
  ...reminderData.callbackAppointments.map((item) => ({
    ...item,
    reminderTypeLabel: "Callback Appointment",
    reminderDateLabel: item.callbackDate
  }))
];

const visibleTodayReminders = allTodayReminders.filter(
  (item) => !clearedReminderIds.includes(item.reminderId)
);

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
  setShowReminderPanel(false);

  navigate("/ba/tmc", {
    state: {
      callbackAppointment: {
        businessName: item.businessName || "",
        mapLink: item.mapLink || "",
        contactNumber: item.contact || ""
      },
      returnTo: "/ba"
    }
  });
};

  return (
    <div className="ba-dashboard-page">
      <section className="ba-dashboard-hero-minimal">
        <div className="ba-dashboard-hero-left">
          <span className="ba-dashboard-date-pill">{today.toUpperCase()}</span>
          <h2>
            {getGreeting()}, {user?.name || "User"}
          </h2>
          <p>Track your calls, forms, updates and daily work from one place.</p>
        </div>

        <div className="ba-dashboard-hero-right">
          <div className="ba-dashboard-hero-actions">
  <div className="ba-reminder-wrap">
    <button
      type="button"
      className="ba-reminder-bell"
      onClick={() => setShowReminderPanel((prev) => !prev)}
    >
      <FiBell />

      {visibleTodayReminders.length > 0 && (
        <span className="ba-reminder-count">
          {visibleTodayReminders.length}
        </span>
      )}
    </button>

    {showReminderPanel && (
      <div className="ba-reminder-panel">
        <div className="ba-reminder-panel-head">
          <div>
            <strong>Today&apos;s Reminders</strong>
            <span>{reminderData.date || getTodayIST()}</span>
          </div>

          {visibleTodayReminders.length > 0 && (
            <button type="button" onClick={handleClearAllReminders}>
              Clear All
            </button>
          )}
        </div>

        {visibleTodayReminders.length === 0 ? (
          <p className="ba-reminder-empty">
            No appointments or callback appointments for today.
          </p>
        ) : (
          <div className="ba-reminder-list">
            {visibleTodayReminders.map((item) => (
              <div
                key={item.reminderId}
                className={`ba-reminder-item ${item.type}`}
                role="button"
                tabIndex={0}
                onClick={() => handleReminderGoToTmc(item)}
                onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleReminderGoToTmc(item);
                }
                }}
              >
                <div className="ba-reminder-content">
                  <span className="ba-reminder-type">
                    {item.reminderTypeLabel}
                  </span>

                  <strong>{item.businessName || "-"}</strong>

                  <p>
                    {item.status || "-"} • {item.reminderDateLabel || "-"}
                  </p>

                  <p>Contact: {item.contact || "-"}</p>

                  {item.mapLink && (
                    <a
                      href={item.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open Map
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className="ba-reminder-clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearReminder(item.reminderId);
                  }}
                >
                  Clear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>

  <Link to="/ba/tmc" className="ba-dashboard-start-btn">
    Start Working
    <FiArrowRight />
  </Link>
</div>
        </div>
      </section>

      <section className="ba-dashboard-summary-grid">
        <Link to="/ba/updates" className="ba-summary-card">
          <div className="ba-summary-icon">
            <FiBell />
          </div>
          <div>
            <span>Unread Updates</span>
            <h3>{updatesUnreadCount}</h3>
            <p>Business updates pending</p>
          </div>
        </Link>

        <Link to="/ba/tmc" className="ba-summary-card">
          <div className="ba-summary-icon">
            <FiPhoneCall />
          </div>
          <div>
            <span>Today's Calling</span>
            <h3>TMC</h3>
            <p>Update calls and statuses</p>
          </div>
        </Link>

        <Link to="/ba/forms" className="ba-summary-card">
          <div className="ba-summary-icon">
            <FiEdit />
          </div>
          <div>
            <span>Business Forms</span>
            <h3>Forms</h3>
            <p>{monthlyFormsResult}/{monthlyFormsGoal} this month</p>
          </div>
        </Link>

        <Link to="/ba/goals" className="ba-summary-card">
          <div className="ba-summary-icon">
            <FiTarget />
          </div>
          <div>
            <span>Goals & Results</span>
            <h3>Track</h3>
            <p>Check target progress</p>
          </div>
        </Link>
      </section>

      <section className="ba-dashboard-analytics-grid">
        <div className="ba-progress-overview-card">
          <div className="ba-section-head">
            <div>
              <h3>Goal Progress Overview</h3>
              <p>Daily performance at a glance</p>
            </div>
          </div>

          <div className="ba-progress-list">
            <div className="ba-progress-block">
              <div className="ba-progress-top">
                <div className="ba-progress-title-wrap">
                  <FiFileText />
                <div>
                  <strong>Daily Presentations</strong>
                  <span>{dailyPresentationResult} / {dailyPresentationGoal}</span>
                </div>
              </div>
                <b style={{ color: presentationTheme.color }}>
                  {Math.round(presentationProgress)}%
                </b>
            </div>

            <div className="ba-progress-bar">
            <div
              className="ba-progress-fill"
              style={{
              width: `${presentationProgress}%`,
              background: presentationTheme.bar
              }}
            />
          </div>
        </div>

        <div className="ba-progress-block">
          <div className="ba-progress-top">
            <div className="ba-progress-title-wrap">
              <FiCheckCircle />
              <div>
                <strong>Daily Appointments</strong>
                <span>{dailyAppointmentResult} / {dailyAppointmentGoal}</span>
              </div>
            </div>
              <b style={{ color: appointmentTheme.color }}>{Math.round(appointmentProgress)}%</b>
          </div>

          <div className="ba-progress-bar">
            <div
              className="ba-progress-fill"
              style={{
                width: `${appointmentProgress}%`,
                background: appointmentTheme.bar
              }}
            />
          </div>
        </div>

        <div className="ba-progress-block">
          <div className="ba-progress-top">
            <div className="ba-progress-title-wrap">
              <FiEdit />
              <div>
                <strong>Daily Forms</strong>
                <span>{dailyFormsResult} / {dailyFormsGoal}</span>
              </div>
            </div>
              <b style={{ color: formsTheme.color }}>
                {Math.round(formsProgress)}%
              </b>
          </div>

          <div className="ba-progress-bar">
          <div
            className="ba-progress-fill"
            style={{
              width: `${formsProgress}%`,
              background: formsTheme.bar
            }}
          />
        </div>
      </div>
    </div>

          <div className="ba-insight-strip">
            <FiTrendingUp />
            <span>
              Keep daily calling consistent to improve form submissions and
              monthly revenue.
            </span>
          </div>
        </div>

        <GoalDonutCard
          title="Daily Call Goal vs Result"
          subtitle="Today performance comparison"
          value={dailyCallResult}
          goal={dailyCallGoal}
        />

        <GoalDonutCard
          title="Monthly Revenue Goal vs Result"
          subtitle="Current month revenue comparison"
          value={monthlyRevenueResult}
          goal={monthlyRevenueGoal}
          prefix="₹"
        />
      </section>
    </div>
  );
};

export default FrontendPage;