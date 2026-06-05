import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

const FrontendPage = () => {

  const [updatesUnreadCount, setUpdatesUnreadCount] = useState(0);

useEffect(() => {
  const fetchUnread = async () => {
    try {
      const { data } = await api.get("/ba-updates/unread-count");
      setUpdatesUnreadCount(Number(data.unreadCount || 0));
    } catch {
      setUpdatesUnreadCount(0);
    }
  };

  fetchUnread();
}, []);
  return (
    <>
      <section className="frontend-command-center">
        <div className="frontend-command-left">
          <h2>Command Center</h2>
          <p>Quick access to your frontend work sections</p>
        </div>
      </section>

      <section className="frontend-cards-grid">

        <Link to="/ba/goals" className="frontend-card">
          <h3>Goals & Results</h3>
          <p>Track daily targets and performance</p>
        </Link>

        <Link to="/ba/tmc" className="frontend-card">
          <h3>TMC</h3>
          <p>Manage calls, status updates and workflow</p>
        </Link>

        <Link to="/ba/data-sheet" className="frontend-card">
          <h3>Data Sheet</h3>
          <p>Check final data and summary details</p>
        </Link>

        <Link to="/ba/forms" className="frontend-card">
          <h3>Forms</h3>
          <p>Fill and manage business forms directly</p>
        </Link>

        <Link to="/ba/updates" className="frontend-card">
          <h3>
  Updates
  {updatesUnreadCount > 0 && (
    <span className="updates-badge">{updatesUnreadCount}</span>
  )}
</h3>
          <p>Track CRM updates for your businesses</p>
        </Link>
        <Link to="/ba/calling-data" className="frontend-card">
          <h3>Calling Data</h3>
          <p>Access assigned leads and track call responses</p>
        </Link>
      </section>
    </>
  );
};

export default FrontendPage;