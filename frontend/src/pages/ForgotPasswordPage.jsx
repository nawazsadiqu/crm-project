import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/ForgotPasswordPage.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-overlay"></div>

      <div className="forgot-wrapper">
        <div className="forgot-logo-wrap">
          <img
            src="/images/logo.png"
            alt="Conquest Techno Solutions"
            className="forgot-logo"
          />
        </div>

        <form className="forgot-card" onSubmit={handleSubmit}>
          <h1 className="forgot-title">Forgot Password</h1>

          <p className="forgot-subtitle">
            Enter your registered email to receive a reset code
          </p>

          <div className="forgot-input-group">
            <input
              type="email"
              placeholder="Enter email"
              className="forgot-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="forgot-btn">
            Send Code
          </button>

          {message && (
            <p className="forgot-message success">
              {message}
              <br />
              Redirecting to reset page...
            </p>
          )}

          {error && <p className="forgot-message error">{error}</p>}

          <div className="forgot-footer">
            <button
              type="button"
              className="forgot-link-btn"
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

export default ForgotPasswordPage;