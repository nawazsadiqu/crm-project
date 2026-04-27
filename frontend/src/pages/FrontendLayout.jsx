import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiUser,
  FiTarget,
  FiPhoneCall,
  FiFileText,
  FiGrid,
  FiBell,
  FiMenu,
  FiX,
  FiDatabase
} from "react-icons/fi";
import "../css/frontend.css";

const FrontendLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/ba", icon: <FiGrid /> },
    { label: "Goals & Results", path: "/ba/goals", icon: <FiTarget /> },
    { label: "TMC", path: "/ba/tmc", icon: <FiPhoneCall /> },
    { label: "Data Sheet", path: "/ba/data-sheet", icon: <FiFileText /> },
    { label: "Updates", path: "/ba/updates", icon: <FiBell /> },
    { label: "Calling Data", path: "/ba/calling-data", icon: <FiDatabase /> },
    { label: "My Profile", path: "/ba/my-profile", icon: <FiUser /> }
  ];

  const isActive = (path) => {
    if (path === "/ba") return location.pathname === "/ba";
    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  return (
    <div className="frontend-layout">
      <div className="frontend-mobile-topbar">
        <h2 className="frontend-mobile-brand">CTS CONEXA</h2>
        <button
          type="button"
          className="frontend-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="frontend-sidebar-overlay"
          onClick={closeSidebar}
        ></div>
      )}

      <aside className={`frontend-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>
          <div className="frontend-sidebar-top">
            <div className="frontend-logo-box">
              <h2>CTS CONEXA</h2>
              <p>Frontend Panel</p>
            </div>
          </div>

          <nav className="frontend-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`frontend-nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="frontend-nav-icon">{item.icon}</span>
                <span className="frontend-nav-text">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="frontend-main">
        <header className="frontend-header">
          <div>
            <h1 className="frontend-page-title">Frontend Section</h1>
            <p className="frontend-page-subtitle">
              Welcome back, {user?.name || "User"}
            </p>
          </div>

          <Link to="/ba/my-profile" className="frontend-user-box">
            <div className="frontend-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3>{user?.name || "User Name"}</h3>
              <p>{user?.role?.toUpperCase() || "FRONTEND"}</p>
            </div>
          </Link>
        </header>

        <div className="frontend-content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default FrontendLayout;