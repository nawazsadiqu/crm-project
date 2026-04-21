import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import "../CSS/dashboard.css";

const DashboardLayout = ({ title, subtitle, navItems, basePath }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  return (
    <div className="dashboard-layout">
      {isSidebarOpen && (
        <div
          className="dashboard-sidebar-overlay"
          onClick={handleCloseSidebar}
        />
      )}

      <aside
        className={`dashboard-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}
      >
        <div className="dashboard-sidebar-top">
          <div className="dashboard-logo-box dashboard-logo-header">
            <div>
              <h2>CTS CONEXA</h2>
              <p>{title}</p>
            </div>

            <button
              type="button"
              className="dashboard-sidebar-close"
              onClick={handleCloseSidebar}
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="dashboard-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleCloseSidebar}
                className={`dashboard-nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="dashboard-nav-icon">{item.icon}</span>
                <span className="dashboard-nav-text">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-mobile-topbar">
          <div className="dashboard-mobile-topbar-left">
            <h2 className="dashboard-mobile-brand">CTS CONEXA</h2>
            <p className="dashboard-mobile-section">{title}</p>
          </div>

          <button
            type="button"
            className="dashboard-hamburger-btn"
            onClick={handleOpenSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        </header>

        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-page-title">{title}</h1>
            <p className="dashboard-page-subtitle">{subtitle}</p>
          </div>

          <Link to={`${basePath}/my-profile`} className="dashboard-user-box">
            <div className="dashboard-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3>{user?.name || "User"}</h3>
              <p>{String(user?.role || "Role").toUpperCase()}</p>
            </div>
          </Link>
        </header>

        <div className="dashboard-content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;