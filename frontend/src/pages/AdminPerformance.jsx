import { useEffect, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";
import "../css/adminPerformance.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

const AdminPerformance = () => {
  const [data, setData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [filterType, setFilterType] = useState("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState("calls");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchPerformance();
  }, [filterType, date]);

  useEffect(() => {
    if (
      selectedData &&
      selectedData.role === "ba" &&
      (filterType === "weekly" || filterType === "monthly")
    ) {
      fetchChartData();
    } else {
      setChartData([]);
    }
  }, [selectedEmployee, selectedEntity, filterType, date, data]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `/api/admin/performance?type=${filterType}&date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching performance:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      if (!selectedData?.userId) {
        setChartData([]);
        return;
      }

      setChartLoading(true);

      const res = await axios.get(
        `/api/admin/performance/chart?userId=${selectedData.userId}&type=${filterType}&date=${date}&entity=${selectedEntity}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setChartData(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const selectedData = data.find(
    (emp) => emp.employeeId === selectedEmployee
  );

  const renderDateInput = () => {
    if (filterType === "daily" || filterType === "weekly") {
      return (
        <input
          className="performance-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      );
    }

    if (filterType === "monthly") {
      return (
        <input
          className="performance-input"
          type="month"
          value={date.slice(0, 7)}
          onChange={(e) => setDate(`${e.target.value}-01`)}
        />
      );
    }

    if (filterType === "yearly") {
      return (
        <input
          className="performance-input performance-year-input"
          type="number"
          min="2020"
          max="2100"
          value={date.slice(0, 4)}
          onChange={(e) => setDate(`${e.target.value}-01-01`)}
        />
      );
    }

    return null;
  };

  const formatCurrency = (value) =>
    `₹ ${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0
    })}`;

  const renderMetrics = () => {
    if (!selectedData?.metrics) return null;

    if (selectedData.role === "ba") {
      const results = selectedData.metrics.results || {};

      return (
        <div className="performance-metrics-section">
          <h3 className="performance-section-heading">Results</h3>
          <div className="performance-metrics-grid">
            {Object.entries(results).map(([key, value]) => (
              <div key={key} className="performance-metric-box">
                <p className="performance-metric-title">{formatLabel(key)}</p>
                <p className="performance-metric-value">
                  {key === "revenue" ? formatCurrency(value) : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="performance-metrics-section">
        <h3 className="performance-section-heading">Metrics</h3>
        <div className="performance-metrics-grid">
          {Object.entries(selectedData.metrics || {}).map(([key, value]) => (
            <div key={key} className="performance-metric-box">
              <p className="performance-metric-title">{formatLabel(key)}</p>
              <p className="performance-metric-value">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGoalsSection = () => {
    if (selectedData?.role !== "ba") return null;

    const goals = selectedData?.metrics?.goals || {};

    return (
      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">Goals</h3>

        <div className="performance-metrics-grid">
          {Object.entries(goals).map(([key, value]) => (
            <div key={key} className="performance-metric-box">
              <p className="performance-metric-title">{formatLabel(key)}</p>
              <p className="performance-metric-value">
                {key === "revenue" ? formatCurrency(value) : value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonSection = () => {
    if (selectedData?.role !== "ba") return null;

    const goals = selectedData?.metrics?.goals || {};
    const results = selectedData?.metrics?.results || {};

    const comparisonFields = [
      "calls",
      "presentations",
      "appointmentFixing",
      "appointmentVisiting",
      "forms",
      "revenue"
    ];

    return (
      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">Comparison</h3>

        <div className="performance-metrics-grid">
          {comparisonFields.map((key) => {
            const goal = Number(goals[key] || 0);
            const result = Number(results[key] || 0);
            const difference = result - goal;
            const percentage =
              goal > 0 ? ((result / goal) * 100).toFixed(1) : 0;

            const formatValue = (val) =>
              key === "revenue" ? formatCurrency(val) : val;

            return (
              <div key={key} className="performance-metric-box">
                <p className="performance-metric-title">{formatLabel(key)}</p>

                <p className="performance-metric-subline">
                  Goal: <strong>{formatValue(goal)}</strong>
                </p>

                <p className="performance-metric-subline">
                  Result: <strong>{formatValue(result)}</strong>
                </p>

                <p className="performance-metric-subline">
                  Difference:{" "}
                  <strong
                    className={
                      difference >= 0
                        ? "comparison-positive"
                        : "comparison-negative"
                    }
                  >
                    {difference >= 0
                      ? key === "revenue"
                        ? `+${formatCurrency(difference)}`
                        : `+${difference}`
                      : key === "revenue"
                      ? `-${formatCurrency(Math.abs(difference))}`
                      : difference}
                  </strong>
                </p>

                <p className="performance-metric-subline">
                  Achievement: <strong>{percentage}%</strong>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChartToolbar = () => {
    if (
      selectedData?.role !== "ba" ||
      (filterType !== "weekly" && filterType !== "monthly")
    ) {
      return null;
    }

    return (
      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">Chart View</h3>
        <div className="performance-chart-toolbar">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="performance-select performance-entity-select"
          >
            <option value="calls">Calls</option>
            <option value="presentations">Presentations</option>
            <option value="appointmentFixing">Appointment Fixing</option>
            <option value="appointmentVisiting">Appointment Visiting</option>
            <option value="forms">Forms</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
      </div>
    );
  };

  const renderEntityChart = () => {
    if (
      selectedData?.role !== "ba" ||
      (filterType !== "weekly" && filterType !== "monthly")
    ) {
      return null;
    }

    return (
      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">
          {formatLabel(selectedEntity)} Chart
        </h3>

        <div className="performance-line-chart">
          {chartLoading ? (
            <div className="performance-empty">Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div className="performance-empty">No chart data found</div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis
                  tickFormatter={(value) =>
                    selectedEntity === "revenue"
                      ? Number(value).toLocaleString("en-IN", {
                          maximumFractionDigits: 0
                        })
                      : value
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    selectedEntity === "revenue"
                      ? formatCurrency(value)
                      : value,
                    name
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="goal"
                  name="Goal"
                  stroke="#9ca3af"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="result"
                  name="Result"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="performance-container">
      <div className="performance-topbar">
        <div>
          <h1 className="performance-title">Performance Dashboard</h1>
          <p className="performance-subtitle">
            View employee performance by period
          </p>
        </div>

        <div className="performance-filters">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="performance-select performance-employee-select"
          >
            <option value="">Select Employee</option>
            {data.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeId} - {emp.name.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="performance-select performance-type-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {renderDateInput()}
        </div>
      </div>

      {loading ? (
        <div className="performance-empty">Loading...</div>
      ) : !selectedEmployee ? (
        <div className="performance-empty">Please select an employee</div>
      ) : !selectedData ? (
        <div className="performance-empty">No data found</div>
      ) : (
        <div className="performance-single-wrap">
          <div className="performance-card">
            <div className="performance-card-header">
              <div>
                <h3 className="performance-employee-name">
                  {selectedData.employeeId} - {selectedData.name.toUpperCase()}
                </h3>
                <p className="performance-role-label">Employee Performance</p>
              </div>

              <span className={`performance-role-badge ${selectedData.role}`}>
                {formatLabel(selectedData.role)}
              </span>
            </div>

            {renderMetrics()}
            {renderGoalsSection()}
            {renderComparisonSection()}
            {renderChartToolbar()}
            {renderEntityChart()}

            <div className="performance-score-card">
              <span className="performance-score-text">Performance Score</span>
              <span className="performance-score-value">
                {selectedData.score}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export default AdminPerformance;