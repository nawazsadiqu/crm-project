import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/callDetails.css";

const statusLabels = {
  AP: "Appointment",
  CBA: "Call Back for Appointment",
  CBP: "Call Back for Presentation",
  CCB: "Customer Call Back",
  NI: "Not Interested",
  CC: "Cut the Call",
  NC: "Not Connected",
  NA: "Not Answered",
  P: "Postponed",
  NL: "Not Answered",
  B: "Not Answered",
  S: "Not Answered"
};

const StatusSection = ({ title, items, total, type }) => {
  return (
    <div className={`call-details-section-card ${type}`}>
      <div className="call-details-section-header">
        <h3>{title}</h3>
        <span className="call-details-total-badge">{total}</span>
      </div>

      <div className="call-details-status-list">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.status} className="call-details-status-block">
              <div className="call-details-status-left">
                <span className="call-details-status-name">
                  {statusLabels[item.status] || item.status}
                </span>
              </div>

              <span className="call-details-status-count">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="call-details-empty">No records found</p>
        )}
      </div>

      <div className="call-details-total-row">
        <strong>
          Total {title}: {total}
        </strong>
      </div>
    </div>
  );
};

const CallDetailsPage = () => {
  const [filterType, setFilterType] = useState("daily");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [data, setData] = useState({
    date: "",
    type: "daily",
    startDate: "",
    endDate: "",
    answered: [],
    notAnswered: [],
    totalAnswered: 0,
    totalNotAnswered: 0,
    totalCalls: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCallDetails();
  }, [selectedDate, filterType]);

  const fetchCallDetails = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/call-details?type=${filterType}&date=${selectedDate}`
      );

      setData(response.data);
      setMessage("");
    } catch (error) {
      setMessage("Failed to fetch call details");
    } finally {
      setLoading(false);
    }
  };

  const renderDateInput = () => {
    if (filterType === "daily" || filterType === "weekly") {
      return (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      );
    }

    if (filterType === "monthly") {
      return (
        <input
          type="month"
          value={selectedDate.slice(0, 7)}
          onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
        />
      );
    }

    return null;
  };

  const getPeriodLabel = () => {
    if (filterType === "daily") {
      return data.date || selectedDate;
    }

    if (data.startDate && data.endDate) {
      return `${data.startDate} to ${data.endDate}`;
    }

    return selectedDate;
  };

  const answeredPercentage =
    data.totalCalls > 0
      ? ((data.totalAnswered / data.totalCalls) * 100).toFixed(1)
      : 0;

  const notAnsweredPercentage =
    data.totalCalls > 0
      ? ((data.totalNotAnswered / data.totalCalls) * 100).toFixed(1)
      : 0;

  return (
    <div className="call-details-page">
      <div className="call-details-card">
        <div className="call-details-header">
          <div>
            <h2 className="call-details-title">Call Details</h2>
            <p className="call-details-subtitle">
              View daily, weekly and monthly call breakdown
            </p>
          </div>
        </div>

        <div className="call-details-filter-card call-details-filter-row">
          <div className="call-details-filter-group">
            <label>Report Type</label>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="call-details-filter-group">
            <label>
              {filterType === "monthly" ? "Select Month" : "Select Date"}
            </label>

            {renderDateInput()}
          </div>
        </div>

        {message && <p className="call-details-message">{message}</p>}

        {loading ? (
          <div className="call-details-empty">Loading call details...</div>
        ) : (
          <>
            <div className="call-details-period-card">
              <span>Showing {filterType} report</span>
              <strong>{getPeriodLabel()}</strong>
            </div>

            <div className="call-details-summary-grid">
              <div className="call-details-summary-card total">
                <h3>Total Calls</h3>
                <p>{data.totalCalls}</p>
              </div>

              <div className="call-details-summary-card answered">
                <h3>Answered Calls</h3>
                <p>{data.totalAnswered}</p>
                <span>{answeredPercentage}% of total calls</span>
              </div>

              <div className="call-details-summary-card not-answered">
                <h3>Not Answered Calls</h3>
                <p>{data.totalNotAnswered}</p>
                <span>{notAnsweredPercentage}% of total calls</span>
              </div>
            </div>

            <div className="call-details-insight-card">
              <h3>Quick Understanding</h3>

              <p>
                In this {filterType} report, total calls are{" "}
                <strong>{data.totalCalls}</strong>. Answered calls are{" "}
                <strong>{data.totalAnswered}</strong> and not answered calls are{" "}
                <strong>{data.totalNotAnswered}</strong>.
              </p>

              {Number(notAnsweredPercentage) >= 50 && data.totalCalls > 0 ? (
                <p className="call-details-warning">
                  Not answered calls are high. BA should focus more on follow-up,
                  callback timing and lead quality.
                </p>
              ) : data.totalCalls > 0 ? (
                <p className="call-details-good">
                  Answered call ratio is better for this period. Continue the same
                  calling discipline.
                </p>
              ) : (
                <p className="call-details-neutral">
                  No calls found for this selected period.
                </p>
              )}
            </div>

            <div className="call-details-grid">
              <StatusSection
                title="Answered Calls"
                items={data.answered || []}
                total={data.totalAnswered || 0}
                type="answered"
              />

              <StatusSection
                title="Not Answered Calls"
                items={data.notAnswered || []}
                total={data.totalNotAnswered || 0}
                type="not-answered"
              />
            </div>
          </>
        )}

        <div className="call-details-bottom-actions">
          <Link to="/ba/data-sheet" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsPage;