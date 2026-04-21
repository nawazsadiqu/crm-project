import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid,
  FiBriefcase,
  FiLayers,
  FiUser
} from "react-icons/fi";
import "../css/dashboard.css";

const WebsiteDeveloperPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/website-developer") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <div className="dashboard-logo-box">
            <h2>CTS CONEXA</h2>
            <p>Developer Panel</p>
          </div>

          <nav className="dashboard-nav">
            <Link
              to="/website-developer"
              className={`dashboard-nav-item ${
                isActive("/website-developer") ? "active" : ""
              }`}
            >
              <FiGrid />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/website-developer/businesses"
              className={`dashboard-nav-item ${
                isActive("/website-developer/businesses") ? "active" : ""
              }`}
            >
              <FiBriefcase />
              <span>Business Data</span>
            </Link>

            <Link
              to="/website-developer/project-planner"
              className={`dashboard-nav-item ${
                isActive("/website-developer/project-planner") ? "active" : ""
              }`}
            >
              <FiLayers />
              <span>Project Planner</span>
            </Link>

            <Link
              to="/website-developer/my-profile"
              className={`dashboard-nav-item ${
                isActive("/website-developer/my-profile") ? "active" : ""
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
              Website Developer Section
            </h1>
            <p className="dashboard-page-subtitle">
              Manage projects and business website tasks
            </p>
          </div>

          <Link
            to="/website-developer/my-profile"
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
          {location.pathname === "/website-developer" ? (
            <div className="dashboard-home-cards">
              <Link
                to="/website-developer/businesses"
                className="dashboard-card"
              >
                <FiBriefcase />
                <span>Business Data</span>
              </Link>

              <Link
                to="/website-developer/project-planner"
                className="dashboard-card"
              >
                <FiLayers />
                <span>Project Planner</span>
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

export default WebsiteDeveloperPage;