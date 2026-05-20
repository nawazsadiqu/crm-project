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
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [filterType, setFilterType] = useState("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState("calls");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const [showCallModal, setShowCallModal] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
const [detailsTitle, setDetailsTitle] = useState("");
const [detailsData, setDetailsData] = useState([]);

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
    setChartLoading(true);

    if (selectedEmployee === "all") {
      const baEmployees = data.filter((emp) => emp.role === "ba" && emp.userId);

      const responses = await Promise.all(
        baEmployees.map((emp) =>
          axios.get(
            `/api/admin/performance/chart?userId=${emp.userId}&type=${filterType}&date=${date}&entity=${selectedEntity}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        )
      );

      const mergedChartData = [];

      responses.forEach((res) => {
        const empChart = Array.isArray(res.data) ? res.data : [];

        empChart.forEach((item, index) => {
          if (!mergedChartData[index]) {
            mergedChartData[index] = {
              label: item.label,
              goal: 0,
              result: 0
            };
          }

          mergedChartData[index].goal += Number(item.goal || 0);
          mergedChartData[index].result += Number(item.result || 0);
        });
      });

      setChartData(mergedChartData);
      return;
    }

    if (!selectedData?.userId) {
      setChartData([]);
      return;
    }

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

  const baEmployees = data.filter((emp) => emp.role === "ba");

const totalBaData = {
  employeeId: "ALL",
  name: "All BA",
  role: "ba",
  score: baEmployees.reduce((sum, emp) => sum + Number(emp.score || 0), 0),
  metrics: {
    goals: {
      calls: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.goals?.calls || 0), 0),
      presentations: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.goals?.presentations || 0), 0),
      appointmentFixing: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.goals?.appointmentFixing || 0), 0),
      appointmentVisiting: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.goals?.appointmentVisiting || 0), 0),
      forms: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.goals?.forms || 0), 0),
      revenue: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.goals?.revenue || 0), 0)
    },
    results: {
  calls: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.results?.calls || 0), 0),
  presentations: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.results?.presentations || 0), 0),
  appointmentFixing: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.results?.appointmentFixing || 0), 0),
  appointmentVisiting: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.results?.appointmentVisiting || 0), 0),
  forms: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.results?.forms || 0), 0),
  revenue: baEmployees.reduce((sum, emp) => sum + Number(emp.metrics?.results?.revenue || 0), 0),

  callDetails: baEmployees.reduce((acc, emp) => {
    const details = emp.metrics?.results?.callDetails || {};

    Object.entries(details).forEach(([status, count]) => {
      acc[status] = (acc[status] || 0) + Number(count || 0);
    });

    return acc;
  }, {}),

  presentationDetails: baEmployees.flatMap(
    (emp) => emp.metrics?.results?.presentationDetails || []
  ),

  appointmentFixingDetails: baEmployees.flatMap(
    (emp) => emp.metrics?.results?.appointmentFixingDetails || []
  ),

  appointmentVisitingDetails: baEmployees.flatMap(
    (emp) => emp.metrics?.results?.appointmentVisitingDetails || []
  ),

  formsDetails: baEmployees.flatMap(
    (emp) => emp.metrics?.results?.formsDetails || []
  ),

  revenueDetails: baEmployees.flatMap(
    (emp) => emp.metrics?.results?.revenueDetails || []
  )
}
  }
};

const selectedData =
  selectedEmployee === "all"
    ? totalBaData
    : data.find((emp) => emp.employeeId === selectedEmployee);

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

    const formatLastUpdated = (dateValue) => {
  if (!dateValue) return "Not updated yet";

  return new Date(dateValue).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

  const renderMetrics = () => {
    if (!selectedData?.metrics) return null;

    if (selectedData.role === "ba") {
      const results = selectedData.metrics.results || {};

      return (
        <div className="performance-metrics-section">
          <h3 className="performance-section-heading">Results</h3>
          <div className="performance-metrics-grid">
            {Object.entries(results)
  .filter(
  ([key]) =>
    ![
      "callDetails",
      "presentationDetails",
      "appointmentFixingDetails",
      "appointmentVisitingDetails",
      "formsDetails",
      "revenueDetails"
    ].includes(key)
    )
  .map(([key, value]) => (
              <div
  key={key}
  className="performance-metric-box"
  onClick={() => {
  if (key === "calls") {
    setShowCallModal(true);
  }

  if (
    [
  "presentations",
  "appointmentFixing",
  "appointmentVisiting",
  "forms",
  "revenue"
].includes(key)
  ) {
    setDetailsTitle(formatLabel(key));

    const detailsKey =
  key === "presentations" ? "presentationDetails" : `${key}Details`;

setDetailsData(
  selectedData?.metrics?.results?.[detailsKey] || []
);

    setShowDetailsModal(true);
  }
}}
  style={{
  cursor:
    key === "calls" ||
    [
      "presentations",
      "appointmentFixing",
      "appointmentVisiting",
      "forms",
      "revenue"
    ].includes(key)
      ? "pointer"
      : "default"
    }}
    >
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

  const renderCallDetailsModal = () => {
  if (!showCallModal) return null;

  const callDetails =
    selectedData?.metrics?.results?.callDetails || {};

  return (
    <div className="performance-modal-overlay">
      <div className="performance-modal">
        <div className="performance-modal-header">
          <h3>Call Details</h3>

          <button
            className="performance-modal-close"
            onClick={() => setShowCallModal(false)}
          >
            ×
          </button>
        </div>

        <div className="performance-metrics-grid">
          {Object.entries(callDetails).map(([status, count]) => (
            <div key={status} className="performance-metric-box">
              <p className="performance-metric-title">
  {{
    AP: "Appointment Fixed",
    CBA: "Call Back fro appointment",
    CBP: "Call Back for Presentation",
    CC: "Cut the Call",
    NI: "Not Interested",
    CCB: "Customer Call Back",
    NA: "Not Answered",
    NC: "Not Connected",
    P: "Postponed"
  }[status] || status}
</p>
              <p className="performance-metric-value">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const renderBusinessDetailsModal = () => {
  if (!showDetailsModal) return null;

  const isAppointmentFixing = detailsTitle === "Appointment Fixing";
  const isAppointmentVisiting = detailsTitle === "Appointment Visiting";
  const isPresentation = detailsTitle === "Presentations";
  const isFormsOrRevenue =
    detailsTitle === "Forms" || detailsTitle === "Revenue";

  return (
    <div className="performance-modal-overlay">
      <div className="performance-modal performance-details-modal">
        <div className="performance-modal-header">
          <h3>{detailsTitle} Details</h3>

          <button
            className="performance-modal-close"
            onClick={() => setShowDetailsModal(false)}
          >
            ×
          </button>
        </div>

        {detailsData.length === 0 ? (
          <div className="performance-empty">No details found</div>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>BA Name</th>
                  <th>Business Name</th>
                  <th>Contact</th>
                  <th>Map</th>

                  {isPresentation && (
                    <>
                     <th>Status</th>
                    </>
                  )}

                  {isAppointmentFixing && (
                    <>
                      <th>Status</th>
                      <th>Appointment Date</th>
                      <th>Date</th>
                    </>
                  )}

                  {isAppointmentVisiting && (
                    <>
                      <th>Response</th>
                      <th>Appointment Date</th>
                      <th>Visited Date</th>
                      <th>Date</th>
                    </>
                  )}

                  {isFormsOrRevenue && (
                    <>
                      <th>Revenue</th>
                      <th>Ex GST</th>
                      <th>Profit Sharing</th>
                      <th>Services</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {detailsData.map((item, index) => (
                  <tr key={item._id || index}>

                    <td>{item.baName || item.employeeName || "-"}</td>
                    
                    <td>{item.businessName || "-"}</td>

                    <td>
                     {item.contact ||
                      item.contactNumber ||
                      item.phoneNumber ||
                      item.mobileNumber ||
                      item.number ||
                      "-"}
                    </td>

                    <td>
                      {item.mapLink || item.googleMapLink || item.locationLink ? (
                        <a
                          href={item.mapLink || item.googleMapLink || item.locationLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    {isPresentation && (
                      <>
                        <td>{item.status || "-"}</td>
                      </>
                    )}

                    {isAppointmentFixing && (
                      <>
                        <td>{item.status || "-"}</td>
                        <td>{item.appointmentDate || "-"}</td>
                        <td>{item.date || "-"}</td>
                      </>
                    )}

                    {isAppointmentVisiting && (
                      <>
                        <td>
                          {item.response ||
                            item.notes ||
                          "-"}
                        </td>
                        <td>{item.appointmentDate || "-"}</td>
                        <td>{item.visitedDate || "-"}</td>
                        <td>{item.date || "-"}</td>
                      </>
                    )}

                    {isFormsOrRevenue && (
                      <>
                        <td>{item.revenue
                            ? formatCurrency(item.revenue)
                            : "-"}
                        </td>

                        <td>{item.exGst
                            ? formatCurrency(item.exGst)
                            : "-"}
                        </td>

                        <td>{item.profitSharing
                            ? formatCurrency(item.profitSharing)
                            : "-"}
                        </td>

                        <td>
                          {[
                            ...(Array.isArray(item.googleServices)
                            ? item.googleServices
                            : []),
                            ...(item.googleServicesOther
                            ? [item.googleServicesOther]
                            : []),
                            ...(Array.isArray(item.otherServices)
                            ? item.otherServices
                            : []),
                            ...(item.otherServicesOther
                            ? [item.otherServicesOther]
                            : [])
                            ]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

  const renderCallDetailsSection = () => {
  if (selectedData?.role !== "ba") return null;

  const callDetails =
    selectedData?.metrics?.results?.callDetails || {};

  return (
    <div className="performance-goals-wrap">
      <h3 className="performance-goals-heading">
        Call Details
      </h3>

      <div className="performance-metrics-grid">
        {Object.entries(callDetails).map(([status, count]) => (
          <div
            key={status}
            className="performance-metric-box"
          >
            <p className="performance-metric-title">
              {status}
            </p>

            <p className="performance-metric-value">
              {count}
            </p>
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

        <p className="admin-goal-update-info">
  Latest goal update:{" "}
  <strong>
    {formatLastUpdated(selectedData?.metrics?.goalLastUpdatedAt)}
  </strong>
</p>

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

   const getMinimumYAxisMax = () => {
  const weeklyMinimums = {
    calls: 120,
    presentations: 25,
    appointmentFixing: 3,
    appointmentVisiting: 2,
    forms: 1,
    revenue: 5000
  };

  const monthlyMinimums = {
    calls: 600,
    presentations: 150,
    appointmentFixing: 15,
    appointmentVisiting: 8,
    forms: 6,
    revenue: 25000
  };

  if (filterType === "monthly") {
    return monthlyMinimums[selectedEntity] || 10;
  }

  return weeklyMinimums[selectedEntity] || 10;
};

const getDynamicYAxisMax = () => {
  const minMax = getMinimumYAxisMax();

  const maxValue = Math.max(
    ...chartData.map((item) =>
      Math.max(Number(item.goal || 0), Number(item.result || 0))
    ),
    minMax
  );

  return maxValue;
};


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
  allowDecimals={false}
  domain={[0, getDynamicYAxisMax()]}
  tickFormatter={(value) =>
    selectedEntity === "revenue"
      ? Number(value).toLocaleString("en-IN", {
          maximumFractionDigits: 0
        })
      : Math.round(value)
  }
/>
                <Tooltip
  formatter={(value, name) => [
    selectedEntity === "revenue"
      ? formatCurrency(value)
      : Math.round(value),
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
            <option value="all">All</option>
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
      {renderCallDetailsModal()}
      {renderBusinessDetailsModal()}
    </div>
  );
};

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export default AdminPerformance;