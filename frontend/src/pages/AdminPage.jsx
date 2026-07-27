import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Menu, X } from "lucide-react";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiBriefcase,
  FiUser,
  FiDatabase,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp
  } from "react-icons/fi";
  import "../css/dashboard.css";

const AdminPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
  totalUsers: 0,
  totalHR: 0,
  totalBA: 0
});

const [todayAttendance, setTodayAttendance] = useState({
  total: 0,
  present: 0,
  absent: 0
});

const [pendingApprovals, setPendingApprovals] = useState(0);

const [monthlyBusiness, setMonthlyBusiness] = useState({
  count: 0,
  revenue: 0,
  balance: 0
});

const token = sessionStorage.getItem("token");

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
  fetchDashboardOverview();
}, []);

const fetchDashboardOverview = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const currentMonthDate = `${new Date().toISOString().slice(0, 7)}-01`;

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const [dashboardRes, attendanceRes, approvalsRes, businessRes] =
      await Promise.allSettled([
        axios.get("/api/admin/dashboard", { headers }),
        axios.get("/api/admin/attendance", { headers }),
        axios.get("/api/form-approvals/pending", { headers }),
        axios.get(
          `/api/admin/business-details?type=monthly&date=${currentMonthDate}`,
          { headers }
        )
      ]);

    if (dashboardRes.status === "fulfilled") {
      setDashboardStats(dashboardRes.value.data.data || {});
    }

    if (attendanceRes.status === "fulfilled") {
      const attendanceData = attendanceRes.value.data.data || [];

      const todayData = attendanceData.filter((item) => item.date === today);

      setTodayAttendance({
        total: todayData.length,
        present: todayData.filter((item) => item.status === "Present").length,
        absent: todayData.filter((item) => item.status === "Absent").length
      });
    }

    if (approvalsRes.status === "fulfilled") {
      const approvalData = approvalsRes.value.data;

      const approvals = Array.isArray(approvalData)
        ? approvalData
        : Array.isArray(approvalData.data)
        ? approvalData.data
        : [];

      setPendingApprovals(approvals.length);
    }

    if (businessRes.status === "fulfilled") {
      const businessData = Array.isArray(businessRes.value.data)
        ? businessRes.value.data
        : [];

      const totalPackageAmount = businessData.reduce(
  (sum, item) =>
    sum +
    Number(
      item.packageAmount ||
      item.revenue ||
      0
    ),
  0
);

const totalBalanceAmount = businessData.reduce(
  (sum, item) =>
    sum + Number(item.balanceAmount || 0),
  0
);

setMonthlyBusiness({
  count: businessData.length,
  revenue: totalPackageAmount - totalBalanceAmount,
  balance: totalBalanceAmount
});
    }
  } catch (error) {
    console.error("Dashboard overview error:", error);
  }
};

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
              to="/admin/duplicate-transaction-approvals"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${
                isActive("/admin/duplicate-transaction-approvals") ? "active" : ""
              }`}
            >
              <FiAlertTriangle />
              <span>Transaction Approvals</span>
            </Link>

            <Link
              to="/admin/calling-data"
              onClick={closeSidebar}
              className={`dashboard-nav-item ${
                isActive("/admin/calling-data") ? "active" : ""
              }`}
            >
              <FiDatabase />
              <span>Calling Data</span>
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
            <div className="admin-dashboard-overview">
  <div className="admin-overview-grid">
  <Link to="/admin/users" className="admin-overview-card">
    <div className="admin-overview-icon">
      <FiUsers />
    </div>
    <div>
      <p>Total Employees</p>
      <h3>{dashboardStats.totalUsers || 0}</h3>
      <span>
        BA: {dashboardStats.totalBA || 0} | HR: {dashboardStats.totalHR || 0}
      </span>
    </div>
  </Link>

  <Link to="/admin/attendance" className="admin-overview-card">
    <div className="admin-overview-icon">
      <FiCheckCircle />
    </div>
    <div>
      <p>Today Present</p>
      <h3>{todayAttendance.present}</h3>
      <span>Total marked: {todayAttendance.total}</span>
    </div>
  </Link>

  <Link
    to="/admin/duplicate-transaction-approvals"
    className="admin-overview-card"
  >
    <div className="admin-overview-icon">
      <FiClock />
    </div>
    <div>
      <p>Pending Approvals</p>
      <h3>{pendingApprovals}</h3>
      <span>Transaction approval requests</span>
    </div>
  </Link>

  <Link to="/admin/business-details" className="admin-overview-card">
    <div className="admin-overview-icon">
      <FiBriefcase />
    </div>
    <div>
      <p>This Month Businesses</p>
      <h3>{monthlyBusiness.count}</h3>
      <span>Submitted business forms</span>
    </div>
  </Link>

  <Link to="/admin/business-details" className="admin-overview-card">
    <div className="admin-overview-icon">
      <FiTrendingUp />
    </div>
    <div>
      <p>This Month Revenue</p>
      <h3>
        ₹{" "}
        {Number(monthlyBusiness.revenue || 0).toLocaleString("en-IN", {
          maximumFractionDigits: 0
        })}
      </h3>
      <span>Total received revenue</span>
    </div>
  </Link>

  <Link to="/admin/business-details" className="admin-overview-card">
    <div className="admin-overview-icon">
      <FiAlertTriangle />
    </div>
    <div>
      <p>This Month Balance</p>
      <h3>
        ₹{" "}
        {Number(monthlyBusiness.balance || 0).toLocaleString("en-IN", {
          maximumFractionDigits: 0
        })}
      </h3>
      <span>Pending payment balance</span>
    </div>
  </Link>
</div>

  <div className="admin-quick-section">
    <div className="admin-section-title-row">
      <div>
        <h3>Quick Actions</h3>
        <p>Open important admin modules</p>
      </div>
    </div>

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

      <Link to="/admin/duplicate-transaction-approvals" className="dashboard-card">
        <FiAlertTriangle />
        <span>Transaction Approvals</span>
      </Link>

      <Link to="/admin/calling-data" className="dashboard-card">
        <FiDatabase />
        <span>Calling Data</span>
      </Link>

      <Link to="/admin/my-profile" className="dashboard-card">
        <FiUser />
        <span>My Profile</span>
      </Link>
    </div>
  </div>
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