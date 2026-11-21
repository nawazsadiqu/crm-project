import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiFilter } from "react-icons/fi";
import api from "../services/api";
import "../css/hrPersonalDetails.css";
import "../css/hrPersonalDetailsCompact.css";

// Fields shown in the View Details popup; the table stays concise.
const EMPLOYEE_DETAIL_SECTIONS = [
  {
    title: "Employee & Employment",
    fields: [
      ["Name", "name"],
      ["Employee ID", "employeeId"],
      ["Linked User Account", "userId"],
      ["Position", "position"],
      ["Role", "role"],
      ["Salary", "salary"],
      ["Date of Join", "dateOfJoin"],
      ["Status", "status"]
    ]
  },
  {
    title: "Contact & Personal Information",
    fields: [
      ["Phone Number", "number"],
      ["Email ID", "mailId"],
      ["Date of Birth", "dob"],
      ["Birth Month", "birthMonth"],
      ["Gender", "gender"],
      ["Qualification", "qualification"],
      ["Father", "father"],
      ["Mother", "mother"],
      ["Parents Number", "parentsNo"],
      ["Parents Number 2", "parentsNo2"],
      ["Address", "address"]
    ]
  }
];

const EMPLOYEE_ROLE_LABELS = {
  ba: "BA",
  telecaller: "Telecaller",
  crm: "CRM",
  websitedeveloper: "Website Developer",
  digitalmarketing: "Digital Marketing",
  hr: "HR",
  admin: "Admin"
};

const getRoleLabel = (role) => {
  const value = String(role || "").trim();
  return EMPLOYEE_ROLE_LABELS[value.toLowerCase()] || value;
};

const HrPersonalDetailsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const formSectionRef = useRef(null);
  const detailCloseButtonRef = useRef(null);
  const [viewEmployeeId, setViewEmployeeId] = useState(null);

  const availableRoles = Array.from(
    new Set(
      employees
        .map((employee) => String(employee.role || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort((first, second) =>
    getRoleLabel(first).localeCompare(getRoleLabel(second))
  );

  const filteredEmployees = employees.filter((employee) => {
    const employeeStatus =
      String(employee.status || "active").trim().toLowerCase() === "inactive"
        ? "inactive"
        : "active";
    const employeeRole = String(employee.role || "").trim().toLowerCase();

    return (
      (statusFilter === "all" || employeeStatus === statusFilter) &&
      (roleFilter === "all" || employeeRole === roleFilter)
    );
  });

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (roleFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
  };

  const selectedEmployee = employees.find(
    (employee) => employee._id === viewEmployeeId
  ) || null;

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
    parentsNo2: "",
    address: "",
    dateOfJoin: "",
    status: "active",
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

  // When HR clicks Add or Edit, bring the form into view.
  useEffect(() => {
    if (showForm) {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [showForm, editingId]);

  // Close with Escape and prevent the employee list from scrolling behind the popup.
  useEffect(() => {
    if (!viewEmployeeId) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    detailCloseButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") setViewEmployeeId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewEmployeeId]);

  const getDetailValue = (employee, field) => {
    if (field === "userId") {
      const linkedId = employee.userId?._id || employee.userId;
      const linkedUser = users.find((item) => item._id === linkedId);
      if (linkedUser) {
        return `${linkedUser.name || "User"} (${linkedUser.email || linkedUser.role || "Account"})`;
      }
      return employee.userId?.name || employee.userId?.email || linkedId || "-";
    }

    const value = employee[field];
    if (value === null || value === undefined || value === "") return "-";
    if (field === "status") return value === "active" ? "Active" : "Inactive";
    return String(value);
  };

  const handleViewDetails = (employee) => {
    setViewEmployeeId(employee._id);
  };

  const handleEditFromDetails = () => {
    if (!selectedEmployee) return;
    const employee = selectedEmployee;
    setViewEmployeeId(null);
    handleEdit(employee);
  };

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
      parentsNo2: "",
      address: "",
      dateOfJoin: "",
      status: "active"
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
      userId: employee.userId?._id || employee.userId || "",
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
      parentsNo2: employee.parentsNo2 || "",
      address: employee.address || "",
      dateOfJoin: employee.dateOfJoin || "",
      status: employee.status || "active"
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

  const handleStatusChange = async (employee, newStatus) => {
    try {
      await api.put(`/employee-details/${employee._id}`, {
        userId: employee.userId?._id || employee.userId || "",
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
        parentsNo2: employee.parentsNo2 || "",
        address: employee.address || "",
        dateOfJoin: employee.dateOfJoin || "",
        status: newStatus,
      });

      setMessage("Employee status updated successfully");
      fetchEmployees();
    } catch (error) {
      console.error("Status update failed:", error);
      setMessage(error.response?.data?.message || "Failed to update employee status");
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
                setShowForm(!showForm);
                setMessage("");
              }}
            >
              {showForm ? "Close Form" : "Add"}
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

        {/* Add/Edit form appears above the employee list. */}
        {showForm && (
          <div className="hr-details-form-section" ref={formSectionRef}>
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
                  <option value="telecaller">
                    Telecaller
                  </option>
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
                <label>Parents No 2</label>
                <input
                  type="text"
                  name="parentsNo2"
                  value={formData.parentsNo2}
                  onChange={handleChange}
                  placeholder="Enter second parents number"
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

              <div className="hr-details-field">
                <label>Status</label>

                <div className="radio-row">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={handleChange}
                    />
                    Active
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={handleChange}
                    />
                    Inactive
                  </label>
                </div>
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

        <div className="hr-details-table-section">
          <div className="hr-details-section-header hr-details-list-heading">
            <div className="hr-details-list-title">
              <h3>Employee List</h3>
              <span className="hr-details-count-badge" aria-label="Matching employees">
                {filteredEmployees.length}
              </span>
              {activeFilterCount > 0 && (
                <span className="hr-details-total-count">
                  of {employees.length} employees
                </span>
              )}
            </div>

            <div className="hr-details-list-tools">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="hr-details-filter-reset"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                className={`hr-details-filter-toggle ${showFilters ? "is-open" : ""}`}
                aria-expanded={showFilters}
                aria-controls="hr-details-filter-panel"
                onClick={() => setShowFilters((current) => !current)}
              >
                <FiFilter aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="hr-details-filter-count">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div id="hr-details-filter-panel" className="hr-details-filter-panel">
              <div className="hr-details-filter-field">
                <label htmlFor="hr-employee-status-filter">Employee Status</label>
                <select
                  id="hr-employee-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="hr-details-filter-field">
                <label htmlFor="hr-employee-role-filter">Employee Role</label>
                <select
                  id="hr-employee-role-filter"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="hr-details-filter-hint">
                Showing {filteredEmployees.length} of {employees.length} employees
              </p>
            </div>
          )}

          {employees.length === 0 ? (
            <p className="hr-details-empty">No employee details found.</p>
          ) : filteredEmployees.length === 0 ? (
            <div className="hr-details-no-matches">
              <p>No employees match the selected filters.</p>
              <button type="button" className="hr-details-filter-reset" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="hr-details-table-wrapper hr-details-compact-wrapper">
              <table className="hr-details-table hr-details-compact-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Phone Number</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((item) => (
                    <tr key={item._id}>
                      <td data-label="Employee">
                        <div className="hr-details-employee-cell">
                          <strong>{item.name || "-"}</strong>
                          <span>{item.role || "-"}</span>
                        </div>
                      </td>
                      <td data-label="Employee ID">{item.employeeId || "-"}</td>
                      <td data-label="Phone Number">{item.number || "-"}</td>
                      <td data-label="Position">{item.position || "-"}</td>
                      <td data-label="Status">
                        <label className="status-switch">
                          <input
                            type="checkbox"
                            checked={(item.status || "active") === "active"}
                            onChange={(e) =>
                              handleStatusChange(
                                item,
                                e.target.checked ? "active" : "inactive"
                              )
                            }
                            aria-label={`Set ${item.name || "employee"} status`}
                          />
                          <span className="status-slider" />
                          <span className="status-text">
                            {(item.status || "active") === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </label>
                      </td>
                      <td data-label="Actions">
                        <div className="action-btn-group hr-details-compact-actions">
                          <button
                            type="button"
                            className="hr-details-view-btn"
                            onClick={() => handleViewDetails(item)}
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
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


      </div>

      {selectedEmployee && (
        <div
          className="hr-details-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewEmployeeId(null);
            }
          }}
        >
          <div
            className="hr-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hr-details-modal-title"
          >
            <div className="hr-details-modal-header">
              <div>
                <p className="hr-details-modal-eyebrow">EMPLOYEE PROFILE</p>
                <h3 id="hr-details-modal-title">
                  {selectedEmployee.name || "Employee Details"}
                </h3>
                <p>{selectedEmployee.employeeId || "Employee ID not provided"}</p>
              </div>
              <button
                ref={detailCloseButtonRef}
                type="button"
                className="hr-details-modal-close"
                onClick={() => setViewEmployeeId(null)}
                aria-label="Close employee details"
              >
                ×
              </button>
            </div>

            <div className="hr-details-modal-body">
              {EMPLOYEE_DETAIL_SECTIONS.map((section) => (
                <section key={section.title} className="hr-details-modal-section">
                  <h4>{section.title}</h4>
                  <div className="hr-details-modal-grid">
                    {section.fields.map(([label, field]) => (
                      <div
                        key={field}
                        className={`hr-details-modal-field ${field === "address" ? "wide" : ""}`}
                      >
                        <span>{label}</span>
                        <strong>{getDetailValue(selectedEmployee, field)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="hr-details-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewEmployeeId(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEditFromDetails}
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrPersonalDetailsPage;