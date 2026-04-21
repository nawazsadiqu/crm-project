import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../CSS/frontendProfile.css";

const FrontendProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const { logout } = useAuth();

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/employee-details/my-profile");
      setProfile(data);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="frontend-profile-page">
      <div className="frontend-profile-card">

        {/* Header */}
        <div className="frontend-profile-header">
          <div>
            <h2 className="frontend-profile-title">My Profile</h2>
            <p className="frontend-profile-subtitle">
              View your personal and account details
            </p>
          </div>
        </div>

        {/* Error Message */}
        {message && (
          <p className="frontend-profile-message">{message}</p>
        )}

        {/* Loading */}
        {!profile ? (
          !message && (
            <p className="frontend-profile-loading">
              Loading profile...
            </p>
          )
        ) : (
          <>
            {/* Top Section */}
            <div className="frontend-profile-top">
              <div className="frontend-profile-avatar">
                {profile.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="frontend-profile-top-info">
                <h3>{profile.name || "User Name"}</h3>
                <p>{profile.role || "Role"}</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="frontend-profile-grid">
              <div className="frontend-profile-item">
                <label>Name</label>
                <input type="text" value={profile.name || ""} readOnly />
              </div>

              <div className="frontend-profile-item">
                <label>Employee ID</label>
                <input
                  type="text"
                  value={profile.employeeId || ""}
                  readOnly
                />
              </div>

              <div className="frontend-profile-item">
                <label>Role</label>
                <input type="text" value={profile.role || ""} readOnly />
              </div>

              <div className="frontend-profile-item">
                <label>Mail-ID</label>
                <input type="text" value={profile.mailId || ""} readOnly />
              </div>
            </div>

            {/* 🔥 Logout at Bottom */}
            <div className="frontend-profile-actions">
              <button
                className="frontend-profile-logout-btn"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FrontendProfilePage;