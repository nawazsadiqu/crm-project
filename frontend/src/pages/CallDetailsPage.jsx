import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/callDetails.css";

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
                <span className="call-details-status-name">{item.status}</span>
              </div>
              <span className="call-details-status-count">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="call-details-empty">No records found</p>
        )}
      </div>

      <div className="call-details-total-row">
        <strong>Total {title}: {total}</strong>
      </div>
    </div>
  );
};

const CallDetailsPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [data, setData] = useState({
    date: "",
    answered: [],
    notAnswered: [],
    totalAnswered: 0,
    totalNotAnswered: 0,
    totalCalls: 0
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCallDetails = async () => {
      try {
        const { data } = await api.get(`/call-details?date=${selectedDate}`);
        setData(data);
        setMessage("");
      } catch (error) {
        setMessage("Failed to fetch call details");
      }
    };

    fetchCallDetails();
  }, [selectedDate]);

  return (
    <div className="call-details-page">
      <div className="call-details-card">
        <div className="call-details-header">
          <div>
            <h2 className="call-details-title">Call Details</h2>
            <p className="call-details-subtitle">
              View answered and not answered call breakdown by date
            </p>
          </div>
        </div>

        <div className="call-details-filter-card">
          <label>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {message && <p className="call-details-message">{message}</p>}

        <div className="call-details-summary-card">
          <h3>Total Number of Calls</h3>
          <p>{data.totalCalls}</p>
        </div>

        <div className="call-details-grid">
          <StatusSection
            title="Answered Calls"
            items={data.answered}
            total={data.totalAnswered}
            type="answered"
          />

          <StatusSection
            title="Not Answered Calls"
            items={data.notAnswered}
            total={data.totalNotAnswered}
            type="not-answered"
          />
        </div>
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