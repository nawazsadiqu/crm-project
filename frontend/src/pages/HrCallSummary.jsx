import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/hrSummary.css";

const HrCallSummary = () => {
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await api.get(`/hr-calls/summary?date=${date}`);
      setData(res.data);
    };

    fetchSummary();
  }, [date]);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="summary-container">
      <h1>HR Call Summary</h1>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="summary-grid">
        <div className="card total">
          <h3>Total Calls</h3>
          <p>{data.total}</p>
        </div>

        <div className="card blue">
          <h3>Not Connected</h3>
          <p>{data.notConnected}</p>
        </div>

        <div className="card green">
          <h3>Answered</h3>
          <p>{data.answered}</p>
        </div>

        <div className="card green">
          <h3>Positive</h3>
          <p>{data.positive}</p>
        </div>

        <div className="card red">
          <h3>Negative</h3>
          <p>{data.negative}</p>
        </div>

        <div className="card yellow">
          <h3>Follow Ups</h3>
          <p>{data.followUp}</p>
        </div>
      </div>
    </div>
  );
};

export default HrCallSummary;