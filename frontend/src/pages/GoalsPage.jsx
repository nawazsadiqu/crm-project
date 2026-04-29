import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/goals.css";

const GoalsPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState("main");

  const [dailyGoals, setDailyGoals] = useState({
    calls: 0,
    presentations: 0,
    appointmentFixing: 0,
    appointmentVisiting: 0,
    forms: 0,
    revenue: 0
  });

  const [weeklyGoals, setWeeklyGoals] = useState({
    calls: 0,
    presentations: 0,
    appointmentFixing: 0,
    appointmentVisiting: 0,
    forms: 0,
    revenue: 0
  });

  const [monthlyGoals, setMonthlyGoals] = useState({
    calls: 0,
    presentations: 0,
    appointmentFixing: 0,
    appointmentVisiting: 0,
    forms: 0,
    revenue: 0
  });

  const [results, setResults] = useState({
    calls: 0,
    presentations: 0,
    appointmentFixing: 0,
    appointmentVisiting: 0,
    forms: 0,
    revenue: 0
  });

  const [weeklyResults, setWeeklyResults] = useState({
  calls: 0,
  presentations: 0,
  appointmentFixing: 0,
  appointmentVisiting: 0,
  forms: 0,
  revenue: 0
});

const [monthlyResults, setMonthlyResults] = useState({
  calls: 0,
  presentations: 0,
  appointmentFixing: 0,
  appointmentVisiting: 0,
  forms: 0,
  revenue: 0
});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchGoalsAndResults = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/goals?date=${selectedDate}`);

      setDailyGoals({
        calls: 0,
        presentations: 0,
        appointmentFixing: data.dailyGoals?.appointmentFixing || 0,
        appointmentVisiting: data.dailyGoals?.appointmentVisiting || 0,
        forms: data.dailyGoals?.forms || 0,
        revenue: data.dailyGoals?.revenue || 0
      });

      setWeeklyGoals({
        calls: data.weeklyGoals?.calls || 0,
        presentations: data.weeklyGoals?.presentations || 0,
        appointmentFixing: data.weeklyGoals?.appointmentFixing || 0,
        appointmentVisiting: data.weeklyGoals?.appointmentVisiting || 0,
        forms: data.weeklyGoals?.forms || 0,
        revenue: data.weeklyGoals?.revenue || 0
      });

      setMonthlyGoals({
        calls: data.monthlyGoals?.calls || 0,
        presentations: data.monthlyGoals?.presentations || 0,
        appointmentFixing: data.monthlyGoals?.appointmentFixing || 0,
        appointmentVisiting: data.monthlyGoals?.appointmentVisiting || 0,
        forms: data.monthlyGoals?.forms || 0,
        revenue: data.monthlyGoals?.revenue || 0
      });

      setResults({
        calls: data.results?.calls || 0,
        presentations: data.results?.presentations || 0,
        appointmentFixing: data.results?.appointmentFixing || 0,
        appointmentVisiting: data.results?.appointmentVisiting || 0,
        forms: data.results?.forms || 0,
        revenue: data.results?.revenue || 0
      });

      setWeeklyResults({
  calls: data.weeklyResults?.calls || 0,
  presentations: data.weeklyResults?.presentations || 0,
  appointmentFixing: data.weeklyResults?.appointmentFixing || 0,
  appointmentVisiting: data.weeklyResults?.appointmentVisiting || 0,
  forms: data.weeklyResults?.forms || 0,
  revenue: data.weeklyResults?.revenue || 0
});

setMonthlyResults({
  calls: data.monthlyResults?.calls || 0,
  presentations: data.monthlyResults?.presentations || 0,
  appointmentFixing: data.monthlyResults?.appointmentFixing || 0,
  appointmentVisiting: data.monthlyResults?.appointmentVisiting || 0,
  forms: data.monthlyResults?.forms || 0,
  revenue: data.monthlyResults?.revenue || 0
});

      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch goals and results"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndResults();
  }, [selectedDate]);

  const handleDailyGoalChange = (e) => {
    const { name, value } = e.target;
    setDailyGoals((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWeeklyGoalChange = (e) => {
    const { name, value } = e.target;
    setWeeklyGoals((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMonthlyGoalChange = (e) => {
    const { name, value } = e.target;
    setMonthlyGoals((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveGoals = async () => {
    try {
      await api.post("/goals", {
        date: selectedDate,

        dailyCallsGoal: Number(dailyGoals.calls || 0),
        dailyPresentationsGoal: Number(dailyGoals.presentations || 0),
        appointmentFixingGoal: Number(dailyGoals.appointmentFixing || 0),
        appointmentVisitingGoal: Number(dailyGoals.appointmentVisiting || 0),
        formsGoal: Number(dailyGoals.forms || 0),
        revenueGoal: Number(dailyGoals.revenue || 0),

        weeklyCallsGoal: Number(weeklyGoals.calls || 0),
        weeklyPresentationsGoal: Number(weeklyGoals.presentations || 0),
        weeklyAppointmentFixingGoal: Number(weeklyGoals.appointmentFixing || 0),
        weeklyAppointmentVisitingGoal: Number(
          weeklyGoals.appointmentVisiting || 0
        ),
        weeklyFormsGoal: Number(weeklyGoals.forms || 0),
        weeklyRevenueGoal: Number(weeklyGoals.revenue || 0),

        monthlyCallsGoal: Number(monthlyGoals.calls || 0),
        monthlyPresentationsGoal: Number(monthlyGoals.presentations || 0),
        monthlyAppointmentFixingGoal: Number(
          monthlyGoals.appointmentFixing || 0
        ),
        monthlyAppointmentVisitingGoal: Number(
          monthlyGoals.appointmentVisiting || 0
        ),
        monthlyFormsGoal: Number(monthlyGoals.forms || 0),
        monthlyRevenueGoal: Number(monthlyGoals.revenue || 0)
      });

      setMessage("Goals saved successfully");
      fetchGoalsAndResults();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save goals");
    }
  };

  const performanceData = useMemo(() => {
    const items = [
      {
        key: "calls",
        label: "Calls",
        goal: Number(dailyGoals.calls || 0),
        result: Number(results.calls || 0)
      },
      {
        key: "presentations",
        label: "Presentations",
        goal: Number(dailyGoals.presentations || 0),
        result: Number(results.presentations || 0)
      },
      {
        key: "appointmentFixing",
        label: "Appointment Fixing",
        goal: Number(dailyGoals.appointmentFixing || 0),
        result: Number(results.appointmentFixing || 0)
      },
      {
        key: "appointmentVisiting",
        label: "Appointment Visiting",
        goal: Number(dailyGoals.appointmentVisiting || 0),
        result: Number(results.appointmentVisiting || 0)
      },
      {
        key: "forms",
        label: "Forms",
        goal: Number(dailyGoals.forms || 0),
        result: Number(results.forms || 0)
      },
      {
        key: "revenue",
        label: "Revenue",
        goal: Number(dailyGoals.revenue || 0),
        result: Number(results.revenue || 0),
        isCurrency: true
      }
    ];

    return items.map((item) => {
      const percentage =
        item.goal > 0 ? Number(((item.result / item.goal) * 100).toFixed(1)) : 0;

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
  }, [dailyGoals, results]);

  const formatValue = (value, isCurrency = false) => {
    if (isCurrency) {
      return `₹${Number(value || 0).toFixed(2)}`;
    }
    return Number(value || 0);
  };

  const buildPerformanceData = (goals, resultData) => {
  const items = [
    { key: "calls", label: "Calls", goal: Number(goals.calls || 0), result: Number(resultData.calls || 0) },
    { key: "presentations", label: "Presentations", goal: Number(goals.presentations || 0), result: Number(resultData.presentations || 0) },
    { key: "appointmentFixing", label: "Appointment Fixing", goal: Number(goals.appointmentFixing || 0), result: Number(resultData.appointmentFixing || 0) },
    { key: "appointmentVisiting", label: "Appointment Visiting", goal: Number(goals.appointmentVisiting || 0), result: Number(resultData.appointmentVisiting || 0) },
    { key: "forms", label: "Forms", goal: Number(goals.forms || 0), result: Number(resultData.forms || 0) },
    { key: "revenue", label: "Revenue", goal: Number(goals.revenue || 0), result: Number(resultData.revenue || 0), isCurrency: true }
  ];

  return items.map((item) => {
    const percentage =
      item.goal > 0 ? Number(((item.result / item.goal) * 100).toFixed(1)) : 0;

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

const weeklyPerformanceData = useMemo(
  () => buildPerformanceData(weeklyGoals, weeklyResults),
  [weeklyGoals, weeklyResults]
);

const monthlyPerformanceData = useMemo(
  () => buildPerformanceData(monthlyGoals, monthlyResults),
  [monthlyGoals, monthlyResults]
);

const getWeekInputValue = (dateString) => {
  const date = new Date(dateString);
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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

  return monday.toISOString().split("T")[0];
};


  return (
    <div className="goals-page">
      <div className="goals-page-card">
        <div className="goals-page-header">
          <div>
            <h2 className="goals-page-title">Goals & Results</h2>
            <p className="goals-page-subtitle">
              Set targets and track daily, weekly and monthly performance
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
      value={selectedDate.slice(0, 7)}
      onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
    />
  ) : activeTab === "weekly" ? (
    <input
      type="week"
      value={getWeekInputValue(selectedDate)}
      onChange={(e) => setSelectedDate(getDateFromWeekInput(e.target.value))}
    />
  ) : (
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
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

        {activeTab === "main" && (
          <>
            <div className="goals-results-grid">
              <div className="goals-panel">
                <div className="goals-panel-header">
                  <h3>Daily Goals</h3>
                </div>

                <div className="goals-fields-grid">
                  <div className="goals-field">
                    <label>Calls</label>
                    <input
                      type="number"
                      name="calls"
                      value={dailyGoals.calls}
                      onChange={handleDailyGoalChange}
                      min="0"
                    />
                  </div>

                  <div className="goals-field">
                    <label>Presentations</label>
                    <input
                      type="number"
                      name="presentations"
                      value={dailyGoals.presentations}
                      onChange={handleDailyGoalChange}
                      min="0"
                    />
                  </div>

                  <div className="goals-field">
                    <label>Appointment Fixing</label>
                    <input
                      type="number"
                      name="appointmentFixing"
                      value={dailyGoals.appointmentFixing}
                      onChange={handleDailyGoalChange}
                      min="0"
                    />
                  </div>

                  <div className="goals-field">
                    <label>Appointment Visiting</label>
                    <input
                      type="number"
                      name="appointmentVisiting"
                      value={dailyGoals.appointmentVisiting}
                      onChange={handleDailyGoalChange}
                      min="0"
                    />
                  </div>

                  <div className="goals-field">
                    <label>Forms</label>
                    <input
                      type="number"
                      name="forms"
                      value={dailyGoals.forms}
                      onChange={handleDailyGoalChange}
                      min="0"
                    />
                  </div>

                  <div className="goals-field">
                    <label>Revenue</label>
                    <input
                      type="number"
                      name="revenue"
                      value={dailyGoals.revenue}
                      onChange={handleDailyGoalChange}
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
                    <label>Presentations</label>
                    <input
                      type="number"
                      value={results.presentations}
                      readOnly
                    />
                  </div>

                  <div className="goals-field">
                    <label>Appointment Fixing</label>
                    <input
                      type="number"
                      value={results.appointmentFixing}
                      readOnly
                    />
                  </div>

                  <div className="goals-field">
                    <label>Appointment Visiting</label>
                    <input
                      type="number"
                      value={results.appointmentVisiting}
                      readOnly
                    />
                  </div>

                  <div className="goals-field">
                    <label>Forms</label>
                    <input type="number" value={results.forms} readOnly />
                  </div>

                  <div className="goals-field">
                    <label>Revenue</label>
                    <input type="number" value={results.revenue} readOnly />
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
                  <h3>Performance Summary</h3>
                  <p>Overview of target achievement against daily goals</p>
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
                      <span className="progress-result">
                        {formatValue(item.result, item.isCurrency)}
                      </span>
                      <span className="progress-divider">/</span>
                      <span className="progress-goal">
                        {formatValue(item.goal, item.isCurrency)}
                      </span>
                    </div>

                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${item.statusClass}`}
                        style={{ width: `${item.progressWidth}%` }}
                      />
                    </div>

                    <div className="progress-footer">
                      <span>{item.percentage}% completed</span>
                      <span>
                        Pending:{" "}
                        {formatValue(
                          Math.max(item.goal - item.result, 0),
                          item.isCurrency
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "weekly" && (
          <div className="goals-panel">
            <div className="goals-panel-header">
              <h3>Weekly Goals</h3>
            </div>

            <div className="goals-fields-grid">
              <div className="goals-field">
                <label>Calls</label>
                <input
                  type="number"
                  name="calls"
                  value={weeklyGoals.calls}
                  onChange={handleWeeklyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Presentations</label>
                <input
                  type="number"
                  name="presentations"
                  value={weeklyGoals.presentations}
                  onChange={handleWeeklyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Appointment Fixing</label>
                <input
                  type="number"
                  name="appointmentFixing"
                  value={weeklyGoals.appointmentFixing}
                  onChange={handleWeeklyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Appointment Visiting</label>
                <input
                  type="number"
                  name="appointmentVisiting"
                  value={weeklyGoals.appointmentVisiting}
                  onChange={handleWeeklyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Forms</label>
                <input
                  type="number"
                  name="forms"
                  value={weeklyGoals.forms}
                  onChange={handleWeeklyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Revenue</label>
                <input
                  type="number"
                  name="revenue"
                  value={weeklyGoals.revenue}
                  onChange={handleWeeklyGoalChange}
                  min="0"
                />
              </div>
            </div>

            <div className="goals-panel-actions">
              <button
                className="btn btn-primary save-goals-btn"
                onClick={handleSaveGoals}
              >
                Save Weekly Goals
              </button>
            </div>
            <div className="goals-performance-section">
  <div className="performance-header">
    <div>
      <h3>Weekly Performance Summary</h3>
      <p>Overview of target achievement against weekly goals</p>
    </div>
  </div>

  <div className="progress-cards-grid">
    {weeklyPerformanceData.map((item) => (
      <div className="progress-card" key={item.key}>
        <div className="progress-card-top">
          <h4>{item.label}</h4>
          <span className={`status-pill ${item.statusClass}`}>
            {item.status}
          </span>
        </div>

        <div className="progress-numbers">
          <span className="progress-result">
            {formatValue(item.result, item.isCurrency)}
          </span>
          <span className="progress-divider">/</span>
          <span className="progress-goal">
            {formatValue(item.goal, item.isCurrency)}
          </span>
        </div>

        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${item.statusClass}`}
            style={{ width: `${item.progressWidth}%` }}
          />
        </div>

        <div className="progress-footer">
          <span>{item.percentage}% completed</span>
          <span>
            Pending:{" "}
            {formatValue(
              Math.max(item.goal - item.result, 0),
              item.isCurrency
            )}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
          </div>
        )}

        {activeTab === "monthly" && (
          <div className="goals-panel">
            <div className="goals-panel-header">
              <h3>Monthly Goals</h3>
            </div>

            <div className="goals-fields-grid">
              <div className="goals-field">
                <label>Calls</label>
                <input
                  type="number"
                  name="calls"
                  value={monthlyGoals.calls}
                  onChange={handleMonthlyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Presentations</label>
                <input
                  type="number"
                  name="presentations"
                  value={monthlyGoals.presentations}
                  onChange={handleMonthlyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Appointment Fixing</label>
                <input
                  type="number"
                  name="appointmentFixing"
                  value={monthlyGoals.appointmentFixing}
                  onChange={handleMonthlyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Appointment Visiting</label>
                <input
                  type="number"
                  name="appointmentVisiting"
                  value={monthlyGoals.appointmentVisiting}
                  onChange={handleMonthlyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Forms</label>
                <input
                  type="number"
                  name="forms"
                  value={monthlyGoals.forms}
                  onChange={handleMonthlyGoalChange}
                  min="0"
                />
              </div>

              <div className="goals-field">
                <label>Revenue</label>
                <input
                  type="number"
                  name="revenue"
                  value={monthlyGoals.revenue}
                  onChange={handleMonthlyGoalChange}
                  min="0"
                />
              </div>
            </div>

            <div className="goals-panel-actions">
              <button
                className="btn btn-primary save-goals-btn"
                onClick={handleSaveGoals}
              >
                Save Monthly Goals
              </button>
            </div>
            <div className="goals-performance-section">
  <div className="performance-header">
    <div>
      <h3>Monthly Performance Summary</h3>
      <p>Overview of target achievement against monthly goals</p>
    </div>
  </div>

  <div className="progress-cards-grid">
    {monthlyPerformanceData.map((item) => (
      <div className="progress-card" key={item.key}>
        <div className="progress-card-top">
          <h4>{item.label}</h4>
          <span className={`status-pill ${item.statusClass}`}>
            {item.status}
          </span>
        </div>

        <div className="progress-numbers">
          <span className="progress-result">
            {formatValue(item.result, item.isCurrency)}
          </span>
          <span className="progress-divider">/</span>
          <span className="progress-goal">
            {formatValue(item.goal, item.isCurrency)}
          </span>
        </div>

        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${item.statusClass}`}
            style={{ width: `${item.progressWidth}%` }}
          />
        </div>

        <div className="progress-footer">
          <span>{item.percentage}% completed</span>
          <span>
            Pending:{" "}
            {formatValue(
              Math.max(item.goal - item.result, 0),
              item.isCurrency
            )}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsPage;