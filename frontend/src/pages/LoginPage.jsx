import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../css/LoginPage.css";
import { HiOutlineUser, HiOutlineLockClosed } from "react-icons/hi";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  const { user, login } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "hr":
        return "/hr";
      case "ba":
        return "/ba";
      case "crm":
        return "/crm";
      case "websiteDeveloper":
        return "/website-developer";
      case "digitalMarketing":
        return "/digital-marketing";
      default:
        return "/login";
    }
  };

  useEffect(() => {
    if (user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/login", formData);
      login(data);
      navigate(getRedirectPath(data.user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-wrapper">
        <div className="login-logo-wrap">
          <img
            src="/images/logo.png"
            alt="Conquest Techno Solutions"
            className="login-logo"
          />
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <h1 className="login-title">Welcome</h1>

          <div className="login-input-group">
            <span className="login-input-icon">
              <HiOutlineUser />
            </span>
            <input
              type="email"
              name="email"
              placeholder="Username or Email"
              value={formData.email}
              onChange={handleChange}
              className="login-input"
            />
          </div>

          <div className="login-input-group">
            <span className="login-input-icon">
              <HiOutlineLockClosed />
            </span>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="login-input"
            />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="forgot-link"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </button>
          </div>

          {error && <p className="error-text login-error">{error}</p>}

          <button type="submit" className="login-btn">
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;