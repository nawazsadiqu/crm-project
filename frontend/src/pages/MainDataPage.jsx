import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/mainData.css";

const MainDataPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [formData, setFormData] = useState({
    date: "",
    totalCalls: 0,
    totalPresentations: 0,
    totalAppointments: 0,
    appointmentsVisited: 0,
    forms: 0,
    revenue: 0
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMainData = async () => {
      try {
        const { data } = await api.get(`/main-data?date=${selectedDate}`);

        setFormData({
          date: data.date || selectedDate,
          totalCalls: data.totalCalls || 0,
          totalPresentations: data.totalPresentations || 0,
          totalAppointments: data.totalAppointments || 0,
          appointmentsVisited: data.appointmentsVisited || 0,
          forms: data.forms || 0,
          revenue: data.revenue || 0
        });

        setMessage("");
      } catch (error) {
        setMessage("Failed to fetch main data");
      }
    };

    fetchMainData();
  }, [selectedDate]);

  const dataItems = [
    { label: "Date", value: formData.date, type: "text" },
    { label: "Total No of Calls", value: formData.totalCalls, type: "number" },
    { label: "No of Presentations", value: formData.totalPresentations, type: "number" },
    { label: "No of Appointments", value: formData.totalAppointments, type: "number" },
    { label: "No of Appointments Visited", value: formData.appointmentsVisited, type: "number" },
    { label: "Forms", value: formData.forms, type: "number" },
    { label: "Revenue", value: formData.revenue, type: "number" }
  ];

  return (
    <div className="main-data-page">
      <div className="main-data-card">
        <div className="main-data-header">
          <div>
            <h2 className="main-data-title">Main Data</h2>
            <p className="main-data-subtitle">
              Daily summary of calls, presentations, appointments, forms, and revenue
            </p>
          </div>

          <Link to="/ba/data-sheet" className="btn btn-secondary">
            Back
          </Link>
        </div>

        <div className="main-data-filter-card">
          <label>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {message && <p className="main-data-message">{message}</p>}

        <div className="main-data-grid">
          {dataItems.map((item) => (
            <div key={item.label} className="main-data-item">
              <label>{item.label}</label>
              <input
                type={item.type}
                value={item.value}
                readOnly
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainDataPage;