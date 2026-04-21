import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/hrPersonalDetails.css";

const HrPersonalDetailsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    number: "",
    employeeId: "",
    mailId: "",
    position: "",
    salary: "",
    dob: "",
    birthMonth: "",
    gender: "",
    qualification: "",
    role: "ba",
    father: "",
    mother: "",
    parentsNo: "",
    address: "",
    dateOfJoin: ""
  });

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get("/employee-details");
      setEmployees(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch employee details"
      );
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedFormData = {
      ...formData,
      [name]: value
    };

    if (name === "dob" && value) {
      const monthName = new Date(value).toLocaleString("en-US", {
        month: "long"
      });
      updatedFormData.birthMonth = monthName;
    }

    if (name === "userId") {
      const selectedUser = users.find((user) => user._id === value);

      if (selectedUser) {
        updatedFormData.name = selectedUser.name || "";
        updatedFormData.mailId = selectedUser.email || "";
        updatedFormData.role = selectedUser.role || "ba";
      }
    }

    setFormData(updatedFormData);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      name: "",
      number: "",
      employeeId: "",
      mailId: "",
      position: "",
      salary: "",
      dob: "",
      birthMonth: "",
      gender: "",
      qualification: "",
      role: "ba",
      father: "",
      mother: "",
      parentsNo: "",
      address: "",
      dateOfJoin: ""
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/employee-details/${editingId}`, formData);
        setMessage("Employee details updated successfully");
      } else {
        await api.post("/employee-details", formData);
        setMessage("Employee details saved successfully");
      }

      resetForm();
      setShowForm(false);
      fetchEmployees();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to save employee details"
      );
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      userId: employee.userId || "",
      name: employee.name || "",
      number: employee.number || "",
      employeeId: employee.employeeId || "",
      mailId: employee.mailId || "",
      position: employee.position || "",
      salary: employee.salary || "",
      dob: employee.dob || "",
      birthMonth: employee.birthMonth || "",
      gender: employee.gender || "",
      qualification: employee.qualification || "",
      role: employee.role || "ba",
      father: employee.father || "",
      mother: employee.mother || "",
      parentsNo: employee.parentsNo || "",
      address: employee.address || "",
      dateOfJoin: employee.dateOfJoin || ""
    });

    setEditingId(employee._id);
    setShowForm(true);
    setMessage("");
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/employee-details/${id}`);
      setMessage("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to delete employee"
      );
    }
  };

  return (
    <div className="hr-details-page">
      <div className="hr-details-card">
        <div className="hr-details-header">
          <div>
            <h2 className="hr-details-title">Personal Details of Employee</h2>
            <p className="hr-details-subtitle">
              Manage employee records and update personal information
            </p>
          </div>

          <div className="hr-details-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
                setMessage("");
              }}
            >
              Add
            </button>

            <button className="btn btn-secondary" onClick={fetchEmployees}>
              Refresh
            </button>

            <Link to="/hr" className="btn btn-secondary">
              Back
            </Link>
          </div>
        </div>

        {message && <p className="hr-details-message">{message}</p>}

        <div className="hr-details-table-section">
          <div className="hr-details-section-header">
            <h3>Employee List</h3>
            <span className="hr-details-count-badge">{employees.length}</span>
          </div>

          {employees.length === 0 ? (
            <p className="hr-details-empty">No employee details found.</p>
          ) : (
            <div className="hr-details-table-wrapper">
              <table className="hr-details-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Number</th>
                    <th>Employee ID</th>
                    <th>Mail-ID</th>
                    <th>Position</th>
                    <th>Salary</th>
                    <th>DOB</th>
                    <th>Birth Month</th>
                    <th>Gender</th>
                    <th>Qualification</th>
                    <th>Role</th>
                    <th>Father</th>
                    <th>Mother</th>
                    <th>Parents No</th>
                    <th>Address</th>
                    <th>Date of Join</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((item) => (
                    <tr key={item._id}>
                      <td>{item.name || "-"}</td>
                      <td>{item.number || "-"}</td>
                      <td>{item.employeeId || "-"}</td>
                      <td>{item.mailId || "-"}</td>
                      <td>{item.position || "-"}</td>
                      <td>{item.salary || "-"}</td>
                      <td>{item.dob || "-"}</td>
                      <td>{item.birthMonth || "-"}</td>
                      <td>{item.gender || "-"}</td>
                      <td>{item.qualification || "-"}</td>
                      <td>{item.role || "-"}</td>
                      <td>{item.father || "-"}</td>
                      <td>{item.mother || "-"}</td>
                      <td>{item.parentsNo || "-"}</td>
                      <td>{item.address || "-"}</td>
                      <td>{item.dateOfJoin || "-"}</td>
                      <td>
                        <div className="action-btn-group">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="hr-details-form-section">
            <div className="hr-details-section-header">
              <h3>{editingId ? "Edit Employee Details" : "Add Employee Details"}</h3>
            </div>

            <div className="hr-details-form-grid">
              <div className="hr-details-field full-width">
                <label>Select User Account</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} | {user.email} | {user.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hr-details-field">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                />
              </div>

              <div className="hr-details-field">
                <label>Number</label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="Enter number"
                />
              </div>

              <div className="hr-details-field">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Enter employee ID"
                />
              </div>

              <div className="hr-details-field">
                <label>Mail-ID</label>
                <input
                  type="email"
                  name="mailId"
                  value={formData.mailId}
                  onChange={handleChange}
                  placeholder="Enter Mail-ID"
                />
              </div>

              <div className="hr-details-field">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Enter position"
                />
              </div>

              <div className="hr-details-field">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter salary"
                />
              </div>

              <div className="hr-details-field">
                <label>DOB</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              <div className="hr-details-field">
                <label>Birth Month</label>
                <input
                  type="text"
                  name="birthMonth"
                  value={formData.birthMonth}
                  readOnly
                />
              </div>

              <div className="hr-details-field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="hr-details-field">
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="Enter qualification"
                />
              </div>

              <div className="hr-details-field">
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

              <div className="hr-details-field">
                <label>Father</label>
                <input
                  type="text"
                  name="father"
                  value={formData.father}
                  onChange={handleChange}
                  placeholder="Enter father name"
                />
              </div>

              <div className="hr-details-field">
                <label>Mother</label>
                <input
                  type="text"
                  name="mother"
                  value={formData.mother}
                  onChange={handleChange}
                  placeholder="Enter mother name"
                />
              </div>

              <div className="hr-details-field">
                <label>Parents No</label>
                <input
                  type="text"
                  name="parentsNo"
                  value={formData.parentsNo}
                  onChange={handleChange}
                  placeholder="Enter parents number"
                />
              </div>

              <div className="hr-details-field">
                <label>Date of Join</label>
                <input
                  type="date"
                  name="dateOfJoin"
                  value={formData.dateOfJoin}
                  onChange={handleChange}
                />
              </div>

              <div className="hr-details-field full-width">
                <label>Address</label>
                <textarea
                  className="hr-details-textarea"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="hr-details-form-actions">
              <button className="btn btn-primary" onClick={handleSave}>
                {editingId ? "Update" : "Save"}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                  setMessage("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HrPersonalDetailsPage;