import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../css/telecallerProfile.css";

const TelecallerProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingReset, setSendingReset] = useState(false);

    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/employee-details/my-profile");
                setProfile(data);
                setMessage("");
            } catch (error) {
                setMessage(
                    error.response?.data?.message || "Failed to fetch profile"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const handleChangePassword = async () => {
        if (sendingReset) return;

        if (!profile?.mailId) {
            setMessage("Email not found for this profile");
            return;
        }

        try {
            setSendingReset(true);
            setMessage("");

            const { data } = await api.post("/auth/forgot-password", {
                email: profile.mailId
            });

            setMessage(data.message || "Reset code sent to your email");

            // Match the existing BA password-reset workflow.
            navigate("/reset-password", {
                state: { email: profile.mailId }
            });
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Failed to send reset code"
            );
        } finally {
            setSendingReset(false);
        }
    };

    return (
        <div className="telecaller-profile-page">
            <div className="telecaller-profile-card">
                <div className="telecaller-profile-header">
                    <div>
                        <h2 className="telecaller-profile-title">My Profile</h2>
                        <p className="telecaller-profile-subtitle">
                            View your personal and account details
                        </p>
                    </div>
                </div>

                {message && (
                    <p className="telecaller-profile-message" role="status">
                        {message}
                    </p>
                )}

                {loading ? (
                    <p className="telecaller-profile-loading">Loading profile...</p>
                ) : profile ? (
                    <>
                        <div className="telecaller-profile-top">
                            <div className="telecaller-profile-avatar">
                                {profile.name?.charAt(0)?.toUpperCase() || "T"}
                            </div>

                            <div className="telecaller-profile-top-info">
                                <h3>{profile.name || "User Name"}</h3>
                                <p>{profile.role || "Telecaller"}</p>
                            </div>
                        </div>

                        <div className="telecaller-profile-grid">
                            <div className="telecaller-profile-item">
                                <label htmlFor="tc-profile-name">Name</label>
                                <input
                                    id="tc-profile-name"
                                    type="text"
                                    value={profile.name || ""}
                                    readOnly
                                />
                            </div>

                            <div className="telecaller-profile-item">
                                <label htmlFor="tc-profile-employee-id">Employee ID</label>
                                <input
                                    id="tc-profile-employee-id"
                                    type="text"
                                    value={profile.employeeId || ""}
                                    readOnly
                                />
                            </div>

                            <div className="telecaller-profile-item">
                                <label htmlFor="tc-profile-role">Role</label>
                                <input
                                    id="tc-profile-role"
                                    type="text"
                                    value={(profile.role || "telecaller").toUpperCase()}
                                    readOnly
                                />
                            </div>

                            <div className="telecaller-profile-item">
                                <label htmlFor="tc-profile-email">Mail-ID</label>
                                <input
                                    id="tc-profile-email"
                                    type="text"
                                    value={profile.mailId || ""}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="telecaller-profile-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleChangePassword}
                                disabled={sendingReset}
                            >
                                {sendingReset ? "Sending..." : "Change Password"}
                            </button>

                            <button
                                type="button"
                                className="telecaller-profile-logout-btn"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default TelecallerProfilePage;
