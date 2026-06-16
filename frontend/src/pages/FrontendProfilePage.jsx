import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../css/frontendProfile.css";

const FrontendProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  const { logout } = useAuth();
  const navigate = useNavigate();

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

  // ✅ Proper logout handler
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleChangePassword = async () => {
  try {
    if (!profile?.mailId) {
      setMessage("Email not found for this profile");
      return;
    }

    const res = await api.post("/auth/forgot-password", {
      email: profile.mailId,
    });

    setMessage(res.data.message || "Reset code sent to your email");

    setTimeout(() => {
      navigate("/reset-password", {
        state: {
          email: profile.mailId,
        },
      });
    }, 1200);
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to send reset code"
    );
  }
};

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
  <input
    type="text"
    value={(profile.role || "").toUpperCase()}
    readOnly
  />
</div>

              <div className="frontend-profile-item">
                <label>Mail-ID</label>
                <input type="text" value={profile.mailId || ""} readOnly />
              </div>
            </div>

            {/* 🔥 Logout at Bottom */}
            <div className="frontend-profile-actions">
  <button
    type="button"
    className="btn btn-primary"
    onClick={handleChangePassword}
  >
    Change Password
  </button>

  <button
    type="button"
    className="frontend-profile-logout-btn"
    onClick={handleLogout}
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