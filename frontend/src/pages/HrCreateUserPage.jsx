import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrCreateUser.css";

const HrCreateUserPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ba"
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCreateUser = async () => {
    try {
      const { data } = await api.post("/auth/register", formData);
      setMessage(data.message || "User created successfully");

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "ba"
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <div className="hr-create-user-page">
      <div className="hr-create-user-card">
        <div className="hr-create-user-header">
          <div>
            <h2 className="hr-create-user-title">Register User</h2>
            <p className="hr-create-user-subtitle">
              Create a new user account and assign a role
            </p>
          </div>

          <Link to="/hr" className="btn btn-secondary">
            Back
          </Link>
        </div>

        {message && <p className="hr-create-user-message">{message}</p>}

        <div className="hr-create-user-form">
          <div className="hr-create-user-field">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="hr-create-user-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="hr-create-user-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="hr-create-user-field">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="ba">BA</option>
              <option value="crm">CRM</option>
              <option value="websiteDeveloper">Website Developer</option>
              <option value="digitalMarketing">Digital Marketing</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="hr-create-user-actions">
          <button className="btn btn-primary" onClick={handleCreateUser}>
            Create User
          </button>
        </div>
      </div>
    </div>
  );
};

export default HrCreateUserPage;