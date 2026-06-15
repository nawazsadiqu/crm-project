import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/hrSummary.css";

const HrCallSummary = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewType, setViewType] = useState("daily");
  const [data, setData] = useState(null);

  const getWeekValue = (dateString) => {
  const selectedDate = new Date(dateString);
  const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
  const days = Math.floor((selectedDate - yearStart) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + yearStart.getDay() + 1) / 7);

  return `${selectedDate.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

const getDateFromWeek = (weekValue) => {
  const [year, week] = weekValue.split("-W");

  const firstDayOfYear = new Date(Number(year), 0, 1);
  const days = (Number(week) - 1) * 7;

  const weekDate = new Date(firstDayOfYear);
  weekDate.setDate(firstDayOfYear.getDate() + days);

  return weekDate.toISOString().split("T")[0];
};

  useEffect(() => {
    const fetchSummary = async () => {
      setData(null);

      const res = await api.get(
        `/hr-calls/summary?date=${date}&type=${viewType}`
      );

      setData(res.data);
    };

    fetchSummary();
  }, [date, viewType]);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="summary-container">
      <h1>HR Call Summary</h1>

      <div className="summary-filters">
        {viewType === "daily" && (
  <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
  />
)}

{viewType === "weekly" && (
  <input
    type="week"
    value={getWeekValue(date)}
    onChange={(e) => setDate(getDateFromWeek(e.target.value))}
  />
)}

{viewType === "monthly" && (
  <input
    type="month"
    value={date.slice(0, 7)}
    onChange={(e) => setDate(`${e.target.value}-01`)}
  />
)}

        <div className="summary-tabs">
          <button
            className={viewType === "daily" ? "active" : ""}
            onClick={() => setViewType("daily")}
          >
            Daily
          </button>

          <button
            className={viewType === "weekly" ? "active" : ""}
            onClick={() => setViewType("weekly")}
          >
            Weekly
          </button>

          <button
            className={viewType === "monthly" ? "active" : ""}
            onClick={() => setViewType("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="summary-grid">
  <div className="card total">
    <h3>Total Calls</h3>
    <p>{data.total}</p>
  </div>

  <div className="card green">
    <h3>Interested</h3>
    <p>{data.interested}</p>
  </div>

  <div className="card red">
    <h3>Not Interested</h3>
    <p>{data.notInterested}</p>
  </div>

  <div className="card red">
    <h3>Not Selected</h3>
    <p>{data.notSelected}</p>
  </div>

  <div className="card yellow">
    <h3>Call Back</h3>
    <p>{data.callBack}</p>
  </div>

  <div className="card blue">
    <h3>Not Lifting</h3>
    <p>{data.notLifting}</p>
  </div>

  <div className="card blue">
    <h3>Not Connected</h3>
    <p>{data.notConnected}</p>
  </div>
</div>
    </div>
  );
};

export default HrCallSummary;