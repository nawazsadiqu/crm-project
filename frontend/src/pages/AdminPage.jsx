import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiBriefcase,
  FiUser,
  FiUserPlus,
  FiPhone
} from "react-icons/fi";
import "../css/dashboard.css";

const AdminPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <div className="dashboard-logo-box">
            <h2>CTS CONEXA</h2>
            <p>Admin Panel</p>
          </div>

          <nav className="dashboard-nav">
            <Link
              to="/admin"
              className={`dashboard-nav-item ${
                isActive("/admin") ? "active" : ""
              }`}
            >
              <FiGrid />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/users"
              className={`dashboard-nav-item ${
                isActive("/admin/users") ? "active" : ""
              }`}
            >
              <FiUsers />
              <span>Employee</span>
            </Link>

            <Link
              to="/admin/attendance"
              className={`dashboard-nav-item ${
                isActive("/admin/attendance") ? "active" : ""
              }`}
            >
              <FiCalendar />
              <span>Attendance</span>
            </Link>

            <Link
              to="/admin/performance"
              className={`dashboard-nav-item ${
                isActive("/admin/performance") ? "active" : ""
              }`}
            >
              <FiBarChart2 />
              <span>Performance</span>
            </Link>

            <Link
              to="/admin/business-details"
              className={`dashboard-nav-item ${
                isActive("/admin/business-details") ? "active" : ""
              }`}
            >
              <FiBriefcase />
              <span>Business Details</span>
            </Link>

            <Link
              to="/admin/my-profile"
              className={`dashboard-nav-item ${
                isActive("/admin/my-profile") ? "active" : ""
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

        {/* CONTENT */}
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