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
  const [activityData, setActivityData] = useState([]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalDetailsTitle, setGoalDetailsTitle] = useState("");
  const [goalDetailsData, setGoalDetailsData] = useState([]);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
  fetchPerformance();
  fetchUserActivity();
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

  const fetchUserActivity = async () => {
  try {
    const res = await axios.get(
      `/api/user-activity/summary?date=${date}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setActivityData(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    setActivityData([]);
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

const fetchGoalDetails = async (key) => {
  try {
    setGoalDetailsTitle(formatLabel(key));

    const userQuery =
      selectedEmployee === "all" ? "" : `&userId=${selectedData.userId}`;

    const res = await axios.get(
      `/api/admin/performance/goals/details?type=${filterType}&date=${date}&entity=${key}${userQuery}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setGoalDetailsData(Array.isArray(res.data) ? res.data : []);
    setShowGoalModal(true);
  } catch (error) {
    console.error("Error fetching goal details:", error);
    setGoalDetailsData([]);
    setShowGoalModal(true);
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

  callRecords: baEmployees.flatMap(
  (employee) =>
    employee.metrics?.results
      ?.callRecords || []
),

tmcPresentationDetails:
  baEmployees.flatMap(
    (employee) =>
      employee.metrics?.results
        ?.tmcPresentationDetails ||
      []
  ),

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

    const selectedActivity = activityData.find(
  (item) =>
    item.userId?.toString() === selectedData?.userId?.toString()
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

    const formatLastUpdated = (dateValue) => {
  if (!dateValue) return "Not updated yet";

  return new Date(dateValue).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const callStatusLabels = {
  AP: "Appointment Fixed",
  CBA: "Call Back for Appointment",
  CBP: "Call Back for Presentation",
  CCB: "Customer Call Back",
  NI: "Not Interested",
  CC: "Cut the Call",
  NC: "Not Connected",
  NA: "Not Answered",
  P: "Postponed",
  CTS_CLIENT: "CTS Client"
};

const getCallStatusLabel = (status) => {
  return (
    callStatusLabels[status] ||
    status ||
    "-"
  );
};

const formatResponseTime = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(dateValue);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
};

const formatActiveTime = (seconds) => {
  const hrs = Math.floor((seconds || 0) / 3600);
  const mins = Math.floor(((seconds || 0) % 3600) / 60);

  return `${hrs}h ${mins}m`;
};

const cleanCsvValue = (value) => {
  if (value === null || value === undefined) return "";

  return `"${String(value).replace(/"/g, '""')}"`;
};

const makeExcelText = (value) => {
  if (!value) return "-";

  return `\t${value}`;
};

const formatCsvDateTime = (dateValue) => {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const getServiceText = (item) => {
  return [
    ...(Array.isArray(item.googleServices) ? item.googleServices : []),
    ...(item.googleServicesOther ? [item.googleServicesOther] : []),
    ...(Array.isArray(item.otherServices) ? item.otherServices : []),
    ...(item.otherServicesOther ? [item.otherServicesOther] : [])
  ]
    .filter(Boolean)
    .join(", ");
};

const downloadDetailsSheet = () => {
  if (!Array.isArray(detailsData) || detailsData.length === 0) {
    return;
  }

  const fileDate = date || new Date().toISOString().slice(0, 10);

  let headers = [];
  let rows = [];

  if (detailsTitle === "Appointment Fixing") {
    headers = [
      "S.No",
      "BA Name",
      "Business Name",
      "Contact",
      "Map Link",
      "Updated Time",
      "Status",
      "Appointment Date",
      "Date"
    ];

    rows = detailsData.map((item, index) => [
      index + 1,
      item.baName || item.employeeName || "-",
      item.businessName || "-",
      item.contact ||
        item.contactNumber ||
        item.phoneNumber ||
        item.mobileNumber ||
        item.number ||
        "-",
      item.mapLink || item.googleMapLink || item.locationLink || "-",
      item.presentationUpdatedAt
        ? makeExcelText(formatCsvDateTime(item.presentationUpdatedAt))
        : "-",
      item.status || "-",
      makeExcelText(item.appointmentDate),
      makeExcelText(item.date)
    ]);
  } else if (detailsTitle === "Appointment Visiting") {
    headers = [
      "S.No",
      "BA Name",
      "Business Name",
      "Contact",
      "Map Link",
      "Updated Time",
      "Response",
      "Appointment Date",
      "Visited Date",
      "Date"
    ];

    rows = detailsData.map((item, index) => [
      index + 1,
      item.baName || item.employeeName || "-",
      item.businessName || "-",
      item.contact ||
        item.contactNumber ||
        item.phoneNumber ||
        item.mobileNumber ||
        item.number ||
        "-",
      item.mapLink || item.googleMapLink || item.locationLink || "-",
      item.presentationUpdatedAt
        ? makeExcelText(formatCsvDateTime(item.presentationUpdatedAt))
        : "-",
      item.response || item.notes || "-",
      makeExcelText(item.appointmentDate),
      makeExcelText(item.visitedDate),
      makeExcelText(item.date)
    ]);
  } else if (detailsTitle === "Forms" || detailsTitle === "Revenue") {
    headers = [
      "S.No",
      "BA Name",
      "Business Name",
      "Contact",
      "Map Link",
      "Revenue",
      "Ex GST",
      "Profit Sharing",
      "Services",
      "Date"
    ];

    rows = detailsData.map((item, index) => [
      index + 1,
      item.baName || item.employeeName || "-",
      item.businessName || "-",
      item.contact ||
        item.contactNumber ||
        item.phoneNumber ||
        item.mobileNumber ||
        item.number ||
        "-",
      item.mapLink || item.googleMapLink || item.locationLink || "-",
      Math.round(getRevenueAmount(item)),
      Math.round(getExGstAmount(item)),
      Math.round(getProfitSharingAmount(item)),
      getServiceText(item) || "-",
      makeExcelText(item.date)
    ]);
  } else {
    headers = [
      "S.No",
      "BA Name",
      "Business Name",
      "Contact",
      "Map Link",
      "Status",
      "Date"
    ];

    rows = detailsData.map((item, index) => [
      index + 1,
      item.baName || item.employeeName || "-",
      item.businessName || "-",
      item.contact ||
        item.contactNumber ||
        item.phoneNumber ||
        item.mobileNumber ||
        item.number ||
        "-",
      item.mapLink || item.googleMapLink || item.locationLink || "-",
      item.status || "-",
      makeExcelText(item.date)
    ]);
  }

  const csvContent = [
    headers.map(cleanCsvValue).join(","),
    ...rows.map((row) => row.map(cleanCsvValue).join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const fileName = `${detailsTitle
    .toLowerCase()
    .replace(/\s+/g, "-")}-${selectedEmployee}-${filterType}-${fileDate}.csv`;

  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const toAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const getDateOnly = (value) => {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

const getPerformanceItemDate = (item) => {
  return getDateOnly(
    item.date ||
      item.paymentDate ||
      item.partialPaymentDate ||
      item.createdAt ||
      item.updatedAt
  );
};

const getRevenueAmount = (item) => {
  return toAmount(
    item.revenue ||
      item.receivedAmount ||
      item.partialPaymentAmount ||
      item.amountPaid ||
      item.paymentAmount
  );
};

const getExGstAmount = (item) => {
  const savedExGst = toAmount(item.exGst);

  if (savedExGst > 0) {
    return savedExGst;
  }

  const revenue = getRevenueAmount(item);

  return revenue > 0 ? revenue / 1.18 : 0;
};

const getProfitSharingAmount = (item) => {
  const savedProfitSharing = toAmount(item.profitSharing);

  if (savedProfitSharing > 0) {
    return savedProfitSharing;
  }

  const exGst = getExGstAmount(item);

  const hasGoogleServices =
    Array.isArray(item.googleServices) && item.googleServices.length > 0;

  const hasOtherServices =
    Array.isArray(item.otherServices) && item.otherServices.length > 0;

  const profitRate = hasOtherServices && !hasGoogleServices ? 0.15 : 0.3;

  return exGst * profitRate;
};

const renderMonthlyFormsCalendar = () => {
  if (selectedData?.role !== "ba" || filterType !== "monthly") {
    return null;
  }

  const formsDetails =
    selectedData?.metrics?.results?.formsDetails || [];

  const revenueDetails =
    selectedData?.metrics?.results?.revenueDetails || [];

  const calendarRevenueDetails =
    revenueDetails.length > 0 ? revenueDetails : formsDetails;

  const selectedMonth = date.slice(0, 7);
  const [yearValue, monthValue] = selectedMonth.split("-").map(Number);

  const firstDayOfMonth = new Date(yearValue, monthValue - 1, 1);
  const lastDayOfMonth = new Date(yearValue, monthValue, 0);

  const totalDays = lastDayOfMonth.getDate();

  const startEmptyBoxes = (firstDayOfMonth.getDay() + 6) % 7;

  const calendarCells = [];

  for (let i = 0; i < startEmptyBoxes; i++) {
    calendarCells.push({
      type: "empty",
      key: `empty-start-${i}`
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayString = String(day).padStart(2, "0");
    const monthString = String(monthValue).padStart(2, "0");
    const dateString = `${yearValue}-${monthString}-${dayString}`;

    const dayForms = formsDetails.filter(
      (item) => getPerformanceItemDate(item) === dateString
    );

    const dayRevenueItems = calendarRevenueDetails.filter(
      (item) => getPerformanceItemDate(item) === dateString
    );

    const dayRevenue = dayRevenueItems.reduce(
      (sum, item) => sum + getRevenueAmount(item),
      0
    );

    const dayName = new Date(
      `${dateString}T12:00:00`
    ).toLocaleDateString("en-IN", {
      weekday: "short"
    });

    calendarCells.push({
      type: "day",
      key: dateString,
      dateString,
      day,
      dayName,
      formsCount: dayForms.length,
      revenue: dayRevenue
    });
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({
      type: "empty",
      key: `empty-end-${calendarCells.length}`
    });
  }

  const monthTitle = firstDayOfMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  const totalForms = formsDetails.length;

  const totalRevenue = calendarRevenueDetails.reduce(
    (sum, item) => sum + getRevenueAmount(item),
    0
  );

  return (
    <div className="performance-goals-wrap">
      <div className="performance-calendar-header">
        <div>
          <h3 className="performance-goals-heading">
            Monthly Forms Calendar
          </h3>
          <p className="performance-calendar-subtitle">
            {monthTitle} daily forms and revenue view
          </p>
        </div>

        <div className="performance-calendar-total-box">
          <span>Total Forms: {totalForms}</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </div>
      </div>

      <div className="performance-calendar-card">
        <div className="performance-calendar-weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
            <div key={dayName} className="performance-calendar-weekday">
              {dayName}
            </div>
          ))}
        </div>

        <div className="performance-calendar-grid">
          {calendarCells.map((cell) => {
            if (cell.type === "empty") {
              return (
                <div
                  key={cell.key}
                  className="performance-calendar-day empty"
                />
              );
            }

            return (
              <div
                key={cell.key}
                className={`performance-calendar-day ${
                  cell.formsCount > 0 || cell.revenue > 0 ? "has-data" : ""
                }`}
              >
                <div className="performance-calendar-date-row">
                  <span className="performance-calendar-date">
                    {cell.day}
                  </span>
                  <span className="performance-calendar-dayname">
                    {cell.dayName}
                  </span>
                </div>

                <div className="performance-calendar-info">
                  <p>
                    Forms: <strong>{cell.formsCount}</strong>
                  </p>
                  <p>
                    Revenue: <strong>{formatCurrency(cell.revenue)}</strong>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

  const renderMetrics = () => {
    if (!selectedData?.metrics) {
  return null;
}

/*
 * CRM should show only its
 * dedicated Goals and Results
 * sections.
 */
if (
  selectedData.role === "crm"
) {
  return null;
}

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
      "callRecords",
      "tmcPresentationDetails",
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
    key === "presentations"
      ? "tmcPresentationDetails"
      : `${key}Details`;

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
      {Object.entries(selectedData.metrics || {})
        .filter(
          ([key]) =>
            ![
              "crmGoals",
              "crmResults",
              "hrGoals",
              "hrResults",
              "goalLastUpdatedAt",
              "goalLastUpdatedBy"
            ].includes(key)
        )
        .map(([key, value]) => (
          <div
            key={key}
            className="performance-metric-box"
            onClick={() => fetchGoalDetails(key)}
            style={{ cursor: "pointer" }}
          >
            <p className="performance-metric-title">
              {formatLabel(key)}
            </p>

            <p className="performance-metric-value">
              {value}
            </p>
          </div>
        ))}
    </div>
  </div>
);
  };

  const renderCrmGoalsResultsSection = () => {
  if (selectedData?.role !== "crm") return null;

  const goals = selectedData?.metrics?.crmGoals || {};
  const results = selectedData?.metrics?.crmResults || {};

  return (
    <>
      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">CRM Goals</h3>

        <p className="admin-goal-update-info">
          Latest update:{" "}
          <strong>
            {formatLastUpdated(selectedData?.metrics?.goalLastUpdatedAt)}
          </strong>
        </p>

        <div className="performance-metrics-grid">
          {Object.entries(goals).map(([key, value]) => (
            <div key={key} className="performance-metric-box">
              <p className="performance-metric-title">{formatLabel(key)}</p>
              <p className="performance-metric-value">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">CRM Results</h3>

        <div className="performance-metrics-grid">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="performance-metric-box">
              <p className="performance-metric-title">{formatLabel(key)}</p>
              <p className="performance-metric-value">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const renderHrGoalsResultsSection = () => {
  if (selectedData?.role !== "hr") return null;

  const goals = selectedData?.metrics?.hrGoals || {};
  const results = selectedData?.metrics?.hrResults || {};

  return (
    <>
      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">HR Goals</h3>

        <p className="admin-goal-update-info">
          Latest update:{" "}
          <strong>
            {formatLastUpdated(selectedData?.metrics?.goalLastUpdatedAt)}
          </strong>
        </p>

        <div className="performance-metrics-grid">
          {Object.entries(goals).map(([key, value]) => (
            <div key={key} className="performance-metric-box">
              <p className="performance-metric-title">{formatLabel(key)}</p>
              <p className="performance-metric-value">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="performance-goals-wrap">
        <h3 className="performance-goals-heading">HR Results</h3>

        <div className="performance-metrics-grid">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="performance-metric-box">
              <p className="performance-metric-title">{formatLabel(key)}</p>
              <p className="performance-metric-value">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

  const renderCallDetailsModal = () => {
  if (!showCallModal) {
    return null;
  }

  const callDetails =
    selectedData?.metrics?.results
      ?.callDetails || {};

  const callRecords = [
    ...(
      selectedData?.metrics?.results
        ?.callRecords || []
    )
  ].sort((first, second) => {
    const firstTime =
      first.respondedAt
        ? new Date(
            first.respondedAt
          ).getTime()
        : 0;

    const secondTime =
      second.respondedAt
        ? new Date(
            second.respondedAt
          ).getTime()
        : 0;

    if (firstTime !== secondTime) {
      return secondTime - firstTime;
    }

    return (
      Number(
        second.callNumber || 0
      ) -
      Number(
        first.callNumber || 0
      )
    );
  });

  return (
    <div className="performance-modal-overlay">
      <div className="performance-modal">
        <div className="performance-modal-header">
          <h3>Call Details</h3>

          <button
            type="button"
            className="performance-modal-close"
            onClick={() =>
              setShowCallModal(false)
            }
          >
            ×
          </button>
        </div>

        <div className="performance-metrics-grid">
          {Object.entries(
            callDetails
          ).map(([status, count]) => (
            <div
              key={status}
              className="performance-metric-box"
            >
              <p className="performance-metric-title">
                {getCallStatusLabel(
                  status
                )}
              </p>

              <p className="performance-metric-value">
                {count}
              </p>
            </div>
          ))}
        </div>

        <div className="performance-call-records-section">
          <h4>Call Response Records</h4>

          {callRecords.length === 0 ? (
            <div className="performance-empty">
              No call records found
            </div>
          ) : (
            <div className="appointments-table-wrapper">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Call No.</th>
                    <th>BA Name</th>
                    <th>Business Name</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {callRecords.map(
                    (item, index) => (
                      <tr
                        key={
                          item._id ||
                          index
                        }
                      >
                        <td>
                          {item.callNumber ||
                            "-"}
                        </td>

                        <td>
                          {item.baName ||
                            "-"}
                        </td>

                        <td>
                          {item.businessName ||
                            "-"}
                        </td>

                        <td>
                          {getCallStatusLabel(
                            item.status
                          )}
                        </td>

                        <td>
                          {formatResponseTime(
                            item.respondedAt
                          )}
                        </td>

                        <td>
                          {item.date || "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
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

  <div className="performance-modal-actions">
    {detailsData.length > 0 && (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={downloadDetailsSheet}
      >
        Download Sheet
      </button>
    )}

    <button
      className="performance-modal-close"
      onClick={() => setShowDetailsModal(false)}
    >
      ×
    </button>
  </div>
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
                  <th>Updated Time</th>

                  {isPresentation && (
                  <>
                  <th>Presentation No.</th>
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

                    <td>
                      {formatResponseTime(
                        item.respondedAt || item.presentationUpdatedAt
                      )}
                    </td>

                    {isPresentation && (
                    <>
                    <td>
                      {item.presentationNumber ||
                      "-"}
                      </td>

                    <td>
                      {item.status || "-"}
                    </td>
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
                        <td>
  {getRevenueAmount(item) > 0
    ? formatCurrency(getRevenueAmount(item))
    : "-"}
</td>

<td>
  {getExGstAmount(item) > 0
    ? formatCurrency(getExGstAmount(item))
    : "-"}
</td>

<td>
  {getProfitSharingAmount(item) > 0
    ? formatCurrency(getProfitSharingAmount(item))
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
            <div
              key={key}
              className="performance-metric-box"
              onClick={() => fetchGoalDetails(key)}
              style={{ cursor: "pointer" }}
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
  };

  const renderGoalDetailsModal = () => {
  if (!showGoalModal) return null;

  return (
    <div className="performance-modal-overlay">
      <div className="performance-modal performance-details-modal">
        <div className="performance-modal-header">
          <h3>{goalDetailsTitle} Goal Details</h3>

          <button
            className="performance-modal-close"
            onClick={() => setShowGoalModal(false)}
          >
            ×
          </button>
        </div>

        {goalDetailsData.length === 0 ? (
          <div className="performance-empty">No goal details found</div>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>BA Name</th>
                  <th>Goal</th>
                  <th>Goal Type</th>
                  <th>Date</th>
                  <th>Updated Time</th>
                </tr>
              </thead>

              <tbody>
                {goalDetailsData.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>{item.employeeId || "-"}</td>
                    <td>{item.baName || "-"}</td>
                    <td>
                      {goalDetailsTitle === "Revenue"
                        ? formatCurrency(item.goalValue)
                        : item.goalValue}
                    </td>
                    <td>{item.goalType || "-"}</td>
                    <td>{item.date || "-"}</td>
                    <td>
                      {item.lastUpdatedAt
                        ? new Date(item.lastUpdatedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })
                        : "-"}
                    </td>
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

  const renderUserActivitySection = () => {
  if (selectedData?.role !== "ba") {
  return null;
}

  return (
    <div className="performance-goals-wrap">
      <h3 className="performance-goals-heading">
        User Activity
      </h3>

      <div className="performance-metrics-grid">

        <div className="performance-metric-box">
          <p className="performance-metric-title">
            Today's Active Time
          </p>

          <p className="performance-metric-value">
            {formatActiveTime(
              selectedActivity?.totalActiveSeconds || 0
            )}
          </p>
        </div>

        <div className="performance-metric-box">
          <p className="performance-metric-title">
            Last Active
          </p>

          <p className="performance-metric-value">
            {selectedActivity?.lastActiveAt
              ? new Date(
                  selectedActivity?.lastActiveAt
                ).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })
              : "-"}
          </p>
        </div>

        <div className="performance-metric-box">
          <p className="performance-metric-title">
            Status
          </p>

          <p
            className="performance-metric-value"
            style={{
              color: selectedActivity?.isOnline
                ? "#16a34a"
                : "#dc2626"
            }}
          >
            {selectedActivity?.isOnline
              ? "Online"
              : "Offline"}
          </p>
        </div>

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
            {data
              .filter((emp) => (emp.status || "active") === "active")
              .map((emp) => (
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
            {renderMonthlyFormsCalendar()}
            {renderCrmGoalsResultsSection()}
            {renderHrGoalsResultsSection()}
            {renderGoalsSection()}
            {renderComparisonSection()}
            {renderUserActivitySection()}
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
      {renderGoalDetailsModal()}
    </div>
  );
};

const formatLabel = (key) => {
  if (key === "posters") return "Posters";
  if (key === "reviewReplies") return "Review Replies";

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export default AdminPerformance;