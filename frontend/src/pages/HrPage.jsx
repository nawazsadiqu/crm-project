import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  FiGrid,
  FiClipboard,
  FiUsers,
  FiUserPlus,
  FiUser,
  FiPhone,
  FiGift
} from "react-icons/fi";
import "../css/dashboard.css";

const HrPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [birthdays, setBirthdays] = useState([]);

  const isActive = (path) => {
    if (path === "/hr") return location.pathname === "/hr";
    return location.pathname.startsWith(path);
  };

  const fetchUpcomingBirthdays = async () => {
    try {
      const { data } = await api.get("/employee-details/upcoming-birthdays?days=5");
      setBirthdays(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch upcoming birthdays", error);
      setBirthdays([]);
    }
  };

  useEffect(() => {
    if (location.pathname === "/hr") {
      fetchUpcomingBirthdays();
    }
  }, [location.pathname]);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <div className="dashboard-logo-box">
            <h2>CTS CONEXA</h2>
            <p>HR Panel</p>
          </div>

          <nav className="dashboard-nav">
            <Link
              to="/hr"
              className={`dashboard-nav-item ${isActive("/hr") ? "active" : ""}`}
            >
              <FiGrid />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/hr/attendance"
              className={`dashboard-nav-item ${isActive("/hr/attendance") ? "active" : ""}`}
            >
              <FiClipboard />
              <span>Attendance</span>
            </Link>

            <Link
              to="/hr/personal-details"
              className={`dashboard-nav-item ${isActive("/hr/personal-details") ? "active" : ""}`}
            >
              <FiUsers />
              <span>Personal Details</span>
            </Link>

            <Link
              to="/hr/create-user"
              className={`dashboard-nav-item ${isActive("/hr/create-user") ? "active" : ""}`}
            >
              <FiUserPlus />
              <span>Create ID</span>
            </Link>

            <Link
              to="/hr/tmc"
              className={`dashboard-nav-item ${isActive("/hr/tmc") ? "active" : ""}`}
            >
              <FiPhone />
              <span>Call Tracking</span>
            </Link>

            <Link
              to="/hr/call-summary"
              className={`dashboard-nav-item ${isActive("/hr/call-summary") ? "active" : ""}`}
            >
              <FiPhone />
              <span>Call Summary</span>
            </Link>

            <Link
              to="/hr/my-profile"
              className={`dashboard-nav-item ${isActive("/hr/my-profile") ? "active" : ""}`}
            >
              <FiUser />
              <span>My Profile</span>
            </Link>
          </nav>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-page-title">HR Section</h1>
            <p className="dashboard-page-subtitle">
              Manage employees, attendance & performance
            </p>
          </div>

          <Link to="/hr/my-profile" className="dashboard-user-box">
            <div className="dashboard-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3>{user?.name}</h3>
              <p>{user?.role?.toUpperCase()}</p>
            </div>
          </Link>
        </header>

        <div className="dashboard-content-area">
          {location.pathname === "/hr" ? (
            <>
              <div className={`dashboard-birthday-card ${birthdays.length === 0 ? "birthday-card-grey" : "birthday-card-active"
              }`}>
                <div className="dashboard-birthday-header">
                  <div className="dashboard-birthday-title-wrap">
                    <FiGift className="dashboard-birthday-icon" />
                    <div>
                      <h3>Upcoming Birthdays</h3>
                      <p>Employees whose birthdays are in the next 5 days</p>
                    </div>
                  </div>

                  <span className="dashboard-birthday-badge">
                    {birthdays.length}
                  </span>
                </div>

                {birthdays.length === 0 ? (
                  <p className="dashboard-birthday-empty">
                    No upcoming birthdays in the next 5 days.
                  </p>
                ) : (
                  <div className="dashboard-birthday-list">
                    {birthdays.map((emp) => (
                  <div
                    key={emp._id}
                    className={`dashboard-birthday-item ${
                    emp.daysLeft === 0
                    ? "birthday-today"
                    : "birthday-upcoming"
                    }`}
                  >
                  <div>
                    <h4>{emp.name}</h4>
                  <p>{emp.role?.toUpperCase()} • DOB: {emp.dob}</p>
                </div>
              <div
                className={`dashboard-birthday-days ${
                emp.daysLeft === 0
                ? "birthday-days-today"
                : "birthday-days-upcoming"
                }`}
              >
                {emp.daysLeft === 0
                ? "Today"
                : `${emp.daysLeft} day${emp.daysLeft > 1 ? "s" : ""} left`}
              </div>
          </div>
          ))}
        </div>
                )}
              </div>

              <div className="dashboard-home-cards">
                <Link to="/hr/attendance" className="dashboard-card">
                  <FiClipboard />
                  <span>Attendance Sheet</span>
                </Link>

                <Link to="/hr/personal-details" className="dashboard-card">
                  <FiUsers />
                  <span>Personal Details</span>
                </Link>

                <Link to="/hr/create-user" className="dashboard-card">
                  <FiUserPlus />
                  <span>Register Employee</span>
                </Link>

                <Link to="/hr/tmc" className="dashboard-card">
                  <FiPhone />
                  <span>Call Tracking</span>
                </Link>

                <Link to="/hr/call-summary" className="dashboard-card">
                  <FiPhone />
                  <span>Call Summary</span>
                </Link>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
};

export default HrPage;