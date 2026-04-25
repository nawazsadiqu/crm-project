import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const FrontendProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEmployeeProfile = async () => {
      try {
        const { data } = await api.get("/employee-details/my-profile");
        setEmployeeProfile(data);
      } catch (error) {
        setEmployeeProfile(null);
        setMessage("Employee details not created yet.");
      }
    };

    fetchEmployeeProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>My Profile</h2>

        <div>
          <p><strong>Name:</strong> {employeeProfile?.name || user?.name || "-"}</p>
          <p><strong>Email:</strong> {employeeProfile?.mailId || user?.email || "-"}</p>
          <p><strong>Role:</strong> {user?.role?.toUpperCase()}</p>
          <p><strong>Employee ID:</strong> {employeeProfile?.employeeId || "Not assigned"}</p>
          <p><strong>Position:</strong> {employeeProfile?.position || "Not assigned"}</p>
        </div>

        {message && <p>{message}</p>}

        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default FrontendProfilePage;