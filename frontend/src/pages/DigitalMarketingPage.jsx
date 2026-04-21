import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid,
  FiBriefcase,
  FiClipboard,
  FiUser
} from "react-icons/fi";
import "../css/dashboard.css";

const DigitalMarketingPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/digital-marketing") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">

          <div className="dashboard-logo-box">
            <h2>CTS CONEXA</h2>
            <p>Marketing Panel</p>
          </div>

          <nav className="dashboard-nav">

            <Link
              to="/digital-marketing"
              className={`dashboard-nav-item ${
                isActive("/digital-marketing") ? "active" : ""
              }`}
            >
              <FiGrid />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/digital-marketing/businesses"
              className={`dashboard-nav-item ${
                isActive("/digital-marketing/businesses") ? "active" : ""
              }`}
            >
              <FiBriefcase />
              <span>Business Details</span>
            </Link>

            <Link
              to="/digital-marketing/work-planner"
              className={`dashboard-nav-item ${
                isActive("/digital-marketing/work-planner") ? "active" : ""
              }`}
            >
              <FiClipboard />
              <span>Work Planner</span>
            </Link>

            <Link
              to="/digital-marketing/my-profile"
              className={`dashboard-nav-item ${
                isActive("/digital-marketing/my-profile") ? "active" : ""
              }`}
            >
              <FiUser />
              <span>My Profile</span>
            </Link>

          </nav>
        </div>
      </aside>

      {/* MAIN */}
      <div className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-page-title">
              Digital Marketing Section
            </h1>
            <p className="dashboard-page-subtitle">
              Manage business marketing tasks and campaigns
            </p>
          </div>

          <Link
            to="/digital-marketing/my-profile"
            className="dashboard-user-box"
          >
            <div className="dashboard-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3>{user?.name}</h3>
              <p>{user?.role}</p>
            </div>
          </Link>
        </header>

        {/* CONTENT */}
        <div className="dashboard-content-area">
          {location.pathname === "/digital-marketing" ? (

            <div className="dashboard-home-cards">

              <Link
                to="/digital-marketing/businesses"
                className="dashboard-card"
              >
                <FiBriefcase />
                <span>Business Details</span>
              </Link>

              <Link
                to="/digital-marketing/work-planner"
                className="dashboard-card"
              >
                <FiClipboard />
                <span>Work Planner</span>
              </Link>

            </div>

          ) : (
            <Outlet />
          )}
        </div>

      </div>
    </div>
  );
};

export default DigitalMarketingPage;