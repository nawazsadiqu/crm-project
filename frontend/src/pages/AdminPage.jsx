import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiBriefcase,
  FiUser
} from "react-icons/fi";
import "../css/dashboard.css";

const AdminPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      {isSidebarOpen && (
        <div className="dashboard-sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className={`dashboard-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        <div className="dashboard-sidebar-top">
          <div className="dashboard-logo-box dashboard-logo-header">
            <div>
              <h2>CTS CONEXA</h2>
              <p>Admin Panel</p>
            </div>

            <button
              type="button"
              className="dashboard-sidebar-close"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="dashboard-nav">
            <Link
              to="/admin"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${isActive("/admin") ? "active" : ""}`}
            >
              <FiGrid />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/users"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${isActive("/admin/users") ? "active" : ""}`}
            >
              <FiUsers />
              <span>Employee</span>
            </Link>

            <Link
              to="/admin/attendance"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${isActive("/admin/attendance") ? "active" : ""}`}
            >
              <FiCalendar />
              <span>Attendance</span>
            </Link>

            <Link
              to="/admin/performance"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${isActive("/admin/performance") ? "active" : ""}`}
            >
              <FiBarChart2 />
              <span>Performance</span>
            </Link>

            <Link
              to="/admin/business-details"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${isActive("/admin/business-details") ? "active" : ""}`}
            >
              <FiBriefcase />
              <span>Business Details</span>
            </Link>

            <Link
              to="/admin/my-profile"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${isActive("/admin/my-profile") ? "active" : ""}`}
            >
              <FiUser />
              <span>My Profile</span>
            </Link>
          </nav>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-mobile-topbar">
          <div className="dashboard-mobile-topbar-left">
            <h2 className="dashboard-mobile-brand">CTS CONEXA</h2>
            <p className="dashboard-mobile-section">Admin Panel</p>
          </div>

          <button
            type="button"
            className="dashboard-hamburger-btn"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        </header>

        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-page-title">Admin Section</h1>
            <p className="dashboard-page-subtitle">
              Manage employees, attendance, performance and business data
            </p>
          </div>

          <Link to="/admin/my-profile" className="dashboard-user-box">
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
          {location.pathname === "/admin" ? (
            <div className="dashboard-home-cards">
              <Link to="/admin/users" className="dashboard-card">
                <FiUsers />
                <span>Employee</span>
              </Link>

              <Link to="/admin/attendance" className="dashboard-card">
                <FiCalendar />
                <span>Attendance</span>
              </Link>

              <Link to="/admin/performance" className="dashboard-card">
                <FiBarChart2 />
                <span>Performance</span>
              </Link>

              <Link to="/admin/business-details" className="dashboard-card">
                <FiBriefcase />
                <span>Business Details</span>
              </Link>

              <Link to="/admin/my-profile" className="dashboard-card">
                <FiUser />
                <span>My Profile</span>
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

export default AdminPage;