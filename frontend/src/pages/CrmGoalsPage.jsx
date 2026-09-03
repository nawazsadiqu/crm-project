import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/goals.css";

const emptyValues = {
  posters: 0,
  reviewReplies: 0,
  contactEscalation: 0,
  otherEscalation: 0,
  clientsQuery: 0,
  schedulingPhotoshoot: 0,
  uploadingPhotoshoot: 0,
  contactReEscalation: 0,
  otherReEscalation: 0,
  monthlyReports: 0,
  clientDataRenewal: 0
};

const crmFields = [
  { key: "posters", label: "Posters" },
  { key: "reviewReplies", label: "Review Replies" },
  { key: "contactEscalation", label: "Contact Escalation" },
  { key: "otherEscalation", label: "Other Escalation" },
  { key: "clientsQuery", label: "Clients Query" },
  { key: "schedulingPhotoshoot", label: "Scheduling Photoshoot" },
  { key: "uploadingPhotoshoot", label: "Uploading Photoshoot" },
  { key: "contactReEscalation", label: "Contact Re-Escalation" },
  { key: "otherReEscalation", label: "Other Re-Escalation" },
  { key: "monthlyReports", label: "Monthly Reports" },
  { key: "clientDataRenewal", label: "Client Data Renewal" }
];

const CrmGoalsPage = () => {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDailyDate, setSelectedDailyDate] = useState(today);
  const [selectedWeekDate, setSelectedWeekDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [activeTab, setActiveTab] = useState("daily");

  const [dailyGoals, setDailyGoals] = useState(emptyValues);
  const [weeklyGoals, setWeeklyGoals] = useState(emptyValues);
  const [monthlyGoals, setMonthlyGoals] = useState(emptyValues);

  const [dailyResults, setDailyResults] = useState(emptyValues);
  const [weeklyResults, setWeeklyResults] = useState(emptyValues);
  const [monthlyResults, setMonthlyResults] = useState(emptyValues);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const getActiveDate = () => {
    if (activeTab === "weekly") return selectedWeekDate;
    if (activeTab === "monthly") return `${selectedMonth}-01`;
    return selectedDailyDate;
  };

  const preventNumberWheel = (e) => {
    e.target.blur();
  };

  const fetchGoalsAndResults = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/crm/goals?date=${getActiveDate()}&type=${activeTab}`
      );

      setDailyGoals({ ...emptyValues, ...(data.dailyGoals || {}) });
      setWeeklyGoals({ ...emptyValues, ...(data.weeklyGoals || {}) });
      setMonthlyGoals({ ...emptyValues, ...(data.monthlyGoals || {}) });

      setDailyResults({ ...emptyValues, ...(data.dailyResults || {}) });
      setWeeklyResults({ ...emptyValues, ...(data.weeklyResults || {}) });
      setMonthlyResults({ ...emptyValues, ...(data.monthlyResults || {}) });

      setLastUpdatedAt(data.lastUpdatedAt || null);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch CRM goals and results"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndResults();
  }, [selectedDailyDate, selectedWeekDate, selectedMonth, activeTab]);

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;

    setter((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await api.post("/crm/goals", {
        date: getActiveDate(),
        type: activeTab,

        dailyGoals,
        weeklyGoals,
        monthlyGoals,

        dailyResults,
        weeklyResults,
        monthlyResults
      });

      setMessage("CRM goals and results saved successfully");
      fetchGoalsAndResults();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to save CRM goals and results"
      );
    }
  };

  const getWeekInputValue = (dateString) => {
    const date = new Date(dateString);
    const tempDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = tempDate.getUTCDay() || 7;

    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);

    return `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  const getDateFromWeekInput = (
  weekValue
) => {
  const [
    yearPart,
    weekPart
  ] = weekValue.split("-W");

  const year =
    Number(yearPart);

  const week =
    Number(weekPart);

  /*
   * ISO Week 1 is the week
   * containing January 4.
   */
  const january4 =
    new Date(
      Date.UTC(
        year,
        0,
        4
      )
    );

  const january4Day =
    january4.getUTCDay() ||
    7;

  /*
   * Monday of ISO Week 1
   */
  const firstMonday =
    new Date(january4);

  firstMonday.setUTCDate(
    january4.getUTCDate() -
      january4Day +
      1
  );

  /*
   * Monday of requested week
   */
  const selectedMonday =
    new Date(firstMonday);

  selectedMonday.setUTCDate(
    firstMonday.getUTCDate() +
      (week - 1) * 7
  );

  return selectedMonday
    .toISOString()
    .slice(0, 10);
};

  const formatLastUpdated = (dateValue) => {
    if (!dateValue) return "Not updated yet";

    return new Date(dateValue).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const buildPerformanceData = (goals, results) => {
    return crmFields.map((field) => {
      const goal = Number(goals[field.key] || 0);
      const result = Number(results[field.key] || 0);
      const percentage =
        goal > 0 ? Number(((result / goal) * 100).toFixed(1)) : 0;

      let status = "No Goal";
      let statusClass = "neutral";

      if (goal > 0) {
        if (result >= goal) {
          status = "Achieved";
          statusClass = "achieved";
        } else if (percentage >= 70) {
          status = "On Track";
          statusClass = "on-track";
        } else {
          status = "Behind";
          statusClass = "behind";
        }
      }

      return {
        ...field,
        goal,
        result,
        percentage,
        progressWidth: Math.min(percentage, 100),
        status,
        statusClass
      };
    });
  };

  const currentGoals =
    activeTab === "weekly"
      ? weeklyGoals
      : activeTab === "monthly"
      ? monthlyGoals
      : dailyGoals;

  const currentResults =
    activeTab === "weekly"
      ? weeklyResults
      : activeTab === "monthly"
      ? monthlyResults
      : dailyResults;

  const currentGoalSetter =
    activeTab === "weekly"
      ? setWeeklyGoals
      : activeTab === "monthly"
      ? setMonthlyGoals
      : setDailyGoals;

  const performanceData = useMemo(() => {
    return buildPerformanceData(currentGoals, currentResults);
  }, [currentGoals, currentResults]);

  const renderFields = (
  values,
  onChange,
  readOnly = false
) => (
  <div className="goals-fields-grid">
    {crmFields.map((field) => (
      <div
        className="goals-field"
        key={field.key}
      >
        <label>
          {field.label}
        </label>

        <input
          type="number"
          name={field.key}
          value={
            values[field.key] ||
            0
          }
          onChange={
            readOnly
              ? undefined
              : onChange
          }
          onWheel={
            preventNumberWheel
          }
          min="0"
          readOnly={readOnly}
          style={
            readOnly
              ? {
                  background:
                    "#f3f4f6",
                  cursor:
                    "not-allowed"
                }
              : undefined
          }
        />
      </div>
    ))}
  </div>
);

  return (
    <div className="goals-page">
      <div className="goals-page-card">
        <div className="goals-page-header">
          <div>
            <h2 className="goals-page-title">CRM Goals & Results</h2>
            <p className="goals-page-subtitle">
              Set goals manually. Daily results are entered manually,
              while weekly and monthly results are calculated automatically
              from daily results.
            </p>
          </div>

          <div className="goals-date-box">
            <label>
              {activeTab === "weekly"
                ? "Select Week"
                : activeTab === "monthly"
                ? "Select Month"
                : "Select Date"}
            </label>

            {activeTab === "monthly" ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                onWheel={preventNumberWheel}
              />
            ) : activeTab === "weekly" ? (
              <input
                type="week"
                value={getWeekInputValue(selectedWeekDate)}
                onChange={(e) =>
                  setSelectedWeekDate(getDateFromWeekInput(e.target.value))
                }
                onWheel={preventNumberWheel}
              />
            ) : (
              <input
                type="date"
                value={selectedDailyDate}
                onChange={(e) => setSelectedDailyDate(e.target.value)}
                onWheel={preventNumberWheel}
              />
            )}
          </div>
        </div>

        <div className="goals-tabs">
          <button
            type="button"
            className={`goals-tab-btn ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => setActiveTab("daily")}
          >
            Daily Goals
          </button>

          <button
            type="button"
            className={`goals-tab-btn ${activeTab === "weekly" ? "active" : ""}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly Goals
          </button>

          <button
            type="button"
            className={`goals-tab-btn ${activeTab === "monthly" ? "active" : ""}`}
            onClick={() => setActiveTab("monthly")}
          >
            Monthly Goals
          </button>
        </div>

        {message && <p className="goals-status-message">{message}</p>}

        <div className="goals-update-info">
          Latest update: <strong>{formatLastUpdated(lastUpdatedAt)}</strong>
        </div>

        <div className="goals-results-grid">
          <div className="goals-panel">
            <div className="goals-panel-header">
              <h3>
                {activeTab === "weekly"
                  ? "Weekly Goals"
                  : activeTab === "monthly"
                  ? "Monthly Goals"
                  : "Daily Goals"}
              </h3>
            </div>

            {renderFields(currentGoals, handleChange(currentGoalSetter))}
          </div>

          <div className="goals-panel results-panel">
  <div className="goals-panel-header">
    <div>
      <h3>
        {activeTab === "weekly"
          ? "Weekly Results"
          : activeTab === "monthly"
          ? "Monthly Results"
          : "Daily Results"}
      </h3>

      {activeTab !== "daily" && (
        <p
          style={{
            margin:
              "5px 0 0",
            fontSize:
              "13px",
            color:
              "#64748b"
          }}
        >
          Automatically calculated
          from Daily Results
        </p>
      )}
    </div>
  </div>

  {activeTab === "daily"
    ? renderFields(
        currentResults,
        handleChange(
          setDailyResults
        ),
        false
      )
    : renderFields(
        currentResults,
        undefined,
        true
      )}

  <div className="goals-panel-actions">
    <button
      className="btn btn-primary save-goals-btn"
      onClick={handleSave}
    >
      {activeTab === "daily"
        ? "Save Daily Goals & Results"
        : activeTab === "weekly"
        ? "Save Weekly Goals"
        : "Save Monthly Goals"}
    </button>
  </div>
</div>
        </div>

        <div className="goals-toolbar">
          <button className="btn btn-primary" onClick={fetchGoalsAndResults}>
            Refresh
          </button>
        </div>

        <div className="goals-performance-section">
          <div className="performance-header">
            <div>
              <h3>
                {activeTab === "weekly"
                  ? "Weekly Performance Summary"
                  : activeTab === "monthly"
                  ? "Monthly Performance Summary"
                  : "Daily Performance Summary"}
              </h3>
              <p>Overview of target achievement against CRM goals</p>
            </div>

            {loading && <span className="loading-text">Loading...</span>}
          </div>

          <div className="progress-cards-grid">
            {performanceData.map((item) => (
              <div className="progress-card" key={item.key}>
                <div className="progress-card-top">
                  <h4>{item.label}</h4>
                  <span className={`status-pill ${item.statusClass}`}>
                    {item.status}
                  </span>
                </div>

                <div className="progress-numbers">
                  <span className="progress-result">{item.result}</span>
                  <span className="progress-divider">/</span>
                  <span className="progress-goal">{item.goal}</span>
                </div>

                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${item.statusClass}`}
                    style={{ width: `${item.progressWidth}%` }}
                  />
                </div>

                <div className="progress-footer">
                  <span>{item.percentage}% completed</span>
                  <span>Pending: {Math.max(item.goal - item.result, 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmGoalsPage;