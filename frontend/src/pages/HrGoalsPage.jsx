import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/goals.css";

const HrGoalsPage = () => {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDailyDate, setSelectedDailyDate] = useState(today);
  const [selectedWeekDate, setSelectedWeekDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [activeTab, setActiveTab] = useState("main");

  const [goals, setGoals] = useState({
    calls: 0,
    resumes: 0,
    schedulingInterview: 0,
    dataSourcing: 0
  });

  const [results, setResults] = useState({
    calls: 0,
    resumes: 0,
    schedulingInterview: 0,
    dataSourcing: 0
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const getActiveType = () => {
    return activeTab === "main" ? "daily" : activeTab;
  };

  const getActiveDate = () => {
    if (activeTab === "weekly") return selectedWeekDate;
    if (activeTab === "monthly") return `${selectedMonth}-01`;
    return selectedDailyDate;
  };

  const fetchGoalsAndResults = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/hr-goals?date=${getActiveDate()}&type=${getActiveType()}`
      );

      setGoals({
        calls: data.goals?.calls || 0,
        resumes: data.goals?.resumes || 0,
        schedulingInterview: data.goals?.schedulingInterview || 0,
        dataSourcing: data.goals?.dataSourcing || 0
      });

      setResults({
        calls: data.results?.calls || 0,
        resumes: data.results?.resumes || 0,
        schedulingInterview: data.results?.schedulingInterview || 0,
        dataSourcing: data.results?.dataSourcing || 0
      });

      setLastUpdatedAt(data.lastUpdatedAt || null);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch HR goals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndResults();
  }, [selectedDailyDate, selectedWeekDate, selectedMonth, activeTab]);

  const handleGoalChange = (e) => {
    const { name, value } = e.target;

    setGoals((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDataSourcingResultChange = (e) => {
    setResults((prev) => ({
      ...prev,
      dataSourcing: e.target.value
    }));
  };

  const handleSaveGoals = async () => {
    try {
      await api.post("/hr-goals", {
        date: getActiveDate(),
        type: getActiveType(),

        callsGoal: Number(goals.calls || 0),
        resumesGoal: Number(goals.resumes || 0),
        schedulingInterviewGoal: Number(goals.schedulingInterview || 0),
        dataSourcingGoal: Number(goals.dataSourcing || 0),
        dataSourcingResult: Number(results.dataSourcing || 0)
      });

      setMessage("HR goals saved successfully");
      fetchGoalsAndResults();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save HR goals");
    }
  };

  const buildPerformanceData = (goalData, resultData) => {
    const items = [
      {
        key: "calls",
        label: "Calls",
        goal: Number(goalData.calls || 0),
        result: Number(resultData.calls || 0)
      },
      {
        key: "resumes",
        label: "Resumes",
        goal: Number(goalData.resumes || 0),
        result: Number(resultData.resumes || 0)
      },
      {
        key: "schedulingInterview",
        label: "Scheduling Interview",
        goal: Number(goalData.schedulingInterview || 0),
        result: Number(resultData.schedulingInterview || 0)
      },
      {
        key: "dataSourcing",
        label: "Data Sourcing",
        goal: Number(goalData.dataSourcing || 0),
        result: Number(resultData.dataSourcing || 0)
      }
    ];

    return items.map((item) => {
      const percentage =
        item.goal > 0
          ? Number(((item.result / item.goal) * 100).toFixed(1))
          : 0;

      let status = "No Goal";
      let statusClass = "neutral";

      if (item.goal > 0) {
        if (item.result >= item.goal) {
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
        ...item,
        percentage,
        progressWidth: Math.min(percentage, 100),
        status,
        statusClass
      };
    });
  };

  const performanceData = useMemo(
    () => buildPerformanceData(goals, results),
    [goals, results]
  );

  const preventNumberWheel = (e) => {
    e.target.blur();
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

  const getDateFromWeekInput = (weekValue) => {
    const [year, week] = weekValue.split("-W").map(Number);
    const firstDayOfYear = new Date(year, 0, 1);
    const days = (week - 1) * 7;

    const monday = new Date(firstDayOfYear);
    monday.setDate(firstDayOfYear.getDate() + days);

    const day = monday.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diffToMonday);

    return new Date(monday.getTime() - monday.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  const formatLastUpdated = (dateValue) => {
    if (!dateValue) return "Not updated yet";

    return new Date(dateValue).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <div className="goals-page">
      <div className="goals-page-card">
        <div className="goals-page-header">
          <div>
            <h2 className="goals-page-title">HR Goals & Results</h2>
            <p className="goals-page-subtitle">
              Set HR targets and track daily, weekly and monthly performance
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
            className={`goals-tab-btn ${activeTab === "main" ? "active" : ""}`}
            onClick={() => setActiveTab("main")}
          >
            Main View
          </button>

          <button
            type="button"
            className={`goals-tab-btn ${
              activeTab === "weekly" ? "active" : ""
            }`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly Goals
          </button>

          <button
            type="button"
            className={`goals-tab-btn ${
              activeTab === "monthly" ? "active" : ""
            }`}
            onClick={() => setActiveTab("monthly")}
          >
            Monthly Goals
          </button>
        </div>

        {message && <p className="goals-status-message">{message}</p>}

        <div className="goals-update-info">
          Latest goal update: <strong>{formatLastUpdated(lastUpdatedAt)}</strong>
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

            <div className="goals-fields-grid">
              <div className="goals-field">
                <label>Calls</label>
                <input
                  type="number"
                  name="calls"
                  value={goals.calls}
                  onChange={handleGoalChange}
                  onWheel={preventNumberWheel}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Resumes</label>
                <input
                  type="number"
                  name="resumes"
                  value={goals.resumes}
                  onChange={handleGoalChange}
                  onWheel={preventNumberWheel}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Scheduling Interview</label>
                <input
                  type="number"
                  name="schedulingInterview"
                  value={goals.schedulingInterview}
                  onChange={handleGoalChange}
                  onWheel={preventNumberWheel}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Data Sourcing</label>
                <input
                  type="number"
                  name="dataSourcing"
                  value={goals.dataSourcing}
                  onChange={handleGoalChange}
                  onWheel={preventNumberWheel}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="goals-panel results-panel">
            <div className="goals-panel-header">
              <h3>Results</h3>
            </div>

            <div className="goals-fields-grid">
              <div className="goals-field">
                <label>Calls</label>
                <input type="number" value={results.calls} readOnly />
              </div>

              <div className="goals-field">
                <label>Resumes</label>
                <input type="number" value={results.resumes} readOnly />
              </div>

              <div className="goals-field">
                <label>Scheduling Interview</label>
                <input
                  type="number"
                  value={results.schedulingInterview}
                  readOnly
                />
              </div>

              <div className="goals-field">
                <label>Data Sourcing</label>
                <input
                  type="number"
                  value={results.dataSourcing}
                  onChange={handleDataSourcingResultChange}
                  onWheel={preventNumberWheel}
                  min="0"
                />
              </div>
            </div>

            <div className="goals-panel-actions">
              <button
                className="btn btn-primary save-goals-btn"
                onClick={handleSaveGoals}
              >
                Save Goals
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
              <p>Overview of target achievement against HR goals</p>
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

export default HrGoalsPage;