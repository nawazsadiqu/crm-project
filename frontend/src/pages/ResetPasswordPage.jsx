import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/ResetPasswordPage.css";

const ResetPasswordPage = () => {
  const [form, setForm] = useState({
    email: "",
    code: "",
    newPassword: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.email) {
      setForm((prev) => ({
        ...prev,
        email: location.state.email
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/reset-password", form);
      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-overlay"></div>

      <div className="reset-wrapper">
        <div className="reset-logo-wrap">
          <img
            src="/images/logo.png"
            alt="Conquest Techno Solutions"
            className="reset-logo"
          />
        </div>

        <form className="reset-card" onSubmit={handleSubmit}>
          <h1 className="reset-title">Reset Password</h1>

          <p className="reset-subtitle">
            Enter the code sent to your email and set a new password
          </p>

          <div className="reset-input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="reset-input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="reset-input-group">
            <input
              type="text"
              name="code"
              placeholder="Enter Code"
              className="reset-input reset-code-input"
              value={form.code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="reset-input-group">
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              className="reset-input"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="reset-btn">
            Reset Password
          </button>

          {message && <p className="reset-message success">{message}</p>}
          {error && <p className="reset-message error">{error}</p>}

          <div className="reset-footer">
            <button
              type="button"
              className="reset-link-btn"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;