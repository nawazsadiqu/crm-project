import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrCreateUser.css";
import {
  FiEye,
  FiEyeOff
} from "react-icons/fi";

const HrCreateUserPage = () => {
  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "ba",
      telecallerCategory: ""
    });

  const [message, setMessage] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const handleChange = (e) => {
    const {
      name,
      value
    } = e.target;

    setFormData((prev) => {
      if (name === "role") {
        return {
          ...prev,
          role: value,

          telecallerCategory:
            value === "telecaller"
              ? prev.telecallerCategory
              : ""
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleCreateUser = async () => {
    try {
      if (
        formData.role === "telecaller" &&
        !formData.telecallerCategory
      ) {
        setMessage(
          "Please select Telecaller Category"
        );

        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,

        telecallerCategory:
          formData.role === "telecaller"
            ? formData.telecallerCategory
            : null
      };

      const { data } = await api.post(
        "/auth/register",
        payload
      );

      setMessage(
        data.message ||
        "User created successfully"
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "ba",
        telecallerCategory: ""
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to create user"
      );
    }
  };

  return (
    <div className="hr-create-user-page">
      <div className="hr-create-user-card">

        <div className="hr-create-user-header">
          <div>
            <h2 className="hr-create-user-title">
              Register User
            </h2>

            <p className="hr-create-user-subtitle">
              Create a new user account and assign a role
            </p>
          </div>

          <Link
            to="/hr"
            className="btn btn-secondary"
          >
            Back
          </Link>
        </div>

        {message && (
          <p className="hr-create-user-message">
            {message}
          </p>
        )}

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

            <div
              style={{
                position: "relative",
                width: "100%"
              }}
            >
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  paddingRight: "45px"
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  border: "none",
                  background:
                    "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#64748b"
                }}
              >
                {showPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>
            </div>
          </div>

          <div className="hr-create-user-field">
            <label>Role</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="ba">
                BA
              </option>

              <option value="telecaller">
                Telecaller
              </option>

              <option value="crm">
                CRM
              </option>

              <option value="websiteDeveloper">
                Website Developer
              </option>

              <option value="digitalMarketing">
                Digital Marketing
              </option>

              <option value="hr">
                HR
              </option>

              <option value="admin">
                Admin
              </option>
            </select>
          </div>

          {formData.role ===
            "telecaller" && (
              <div className="hr-create-user-field">
                <label>
                  Telecaller Category
                </label>

                <select
                  name="telecallerCategory"
                  value={
                    formData.telecallerCategory
                  }
                  onChange={handleChange}
                >
                  <option value="">
                    Select Category
                  </option>

                  <option value="GBP">
                    Google Business Profile
                  </option>

                  <option value="WEBSITE">
                    Website
                  </option>

                  <option value="WHATSAPP_BROADCAST">
                    WhatsApp Broadcast Manager
                  </option>
                </select>
              </div>
            )}

        </div>

        <div className="hr-create-user-actions">
          <button
            className="btn btn-primary"
            onClick={handleCreateUser}
          >
            Create User
          </button>
        </div>

      </div>
    </div>
  );
};

export default HrCreateUserPage;