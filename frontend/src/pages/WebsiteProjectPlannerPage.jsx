import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/websiteProjectPlanner.css";

const WebsiteProjectPlannerPage = () => {
  const [businessOptions, setBusinessOptions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    formId: "",
    businessName: "",
    startDate: "",
    endDate: ""
  });

  const fetchBusinessOptions = async () => {
    try {
      const { data } = await api.get("/website-developer/business-options");
      setBusinessOptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/website-developer/projects");
      setProjects(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage("Failed to fetch project planner data");
    }
  };

  useEffect(() => {
    fetchBusinessOptions();
    fetchProjects();
  }, []);

  const handleBusinessChange = (e) => {
    const selectedId = e.target.value;
    const selectedBusiness = businessOptions.find(
      (item) => item._id === selectedId
    );

    setFormData((prev) => ({
      ...prev,
      formId: selectedId,
      businessName: selectedBusiness?.businessName || ""
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (
      !formData.formId ||
      !formData.startDate ||
      !formData.endDate
    ) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      await api.post("/website-developer/projects", formData);

      setMessage("Project saved successfully");

      setFormData({
        formId: "",
        businessName: "",
        startDate: "",
        endDate: ""
      });

      fetchProjects();
    } catch {
      setMessage("Failed to save project");
    }
  };

  return (
    <div className="project-page">

      {/* CARD */}
      <div className="project-card">

        {/* HEADER */}
        <div className="project-header">
          <div>
            <h2>Website Project Planner</h2>
            <p>Plan and manage website development timelines</p>
          </div>

          <button className="btn btn-secondary" onClick={fetchProjects}>
            Refresh
          </button>
        </div>

        {message && <p className="project-message">{message}</p>}

        {/* FORM */}
        <div className="project-form">

          <div className="project-field">
            <label>Select Business</label>
            <select value={formData.formId} onChange={handleBusinessChange}>
              <option value="">Select business</option>
              {businessOptions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.businessName}
                </option>
              ))}
            </select>
          </div>

          <div className="project-field">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>

          <div className="project-field">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="project-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Project
          </button>
        </div>

        {/* TABLE */}
        <div className="project-table-section">
          <h3>Planned Projects</h3>

          {projects.length === 0 ? (
            <p className="empty">No project records found.</p>
          ) : (
            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>

                <tbody>
                  {projects.map((item) => (
                    <tr key={item._id}>
                      <td>{item.businessName}</td>
                      <td>{item.startDate}</td>
                      <td>{item.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WebsiteProjectPlannerPage;