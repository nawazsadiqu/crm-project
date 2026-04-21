import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const DataSheetPage = () => {
  const [formData, setFormData] = useState({
    clientName: "",
    businessName: "",
    mapLocation: "",
    service: "",
    amount: "",
    clientEmail: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/clients", {
        ...formData,
        amount: Number(formData.amount)
      });

      setMessage("Client created successfully");

      setFormData({
        clientName: "",
        businessName: "",
        mapLocation: "",
        service: "",
        amount: "",
        clientEmail: "",
        password: ""
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create client");
    }
  };

  return (
    <div className="page-center">
      <form className="form-card long" onSubmit={handleSubmit}>
        <h1>Data Sheet</h1>

        <input
          name="clientName"
          placeholder="Client Name"
          value={formData.clientName}
          onChange={handleChange}
        />

        <input
          name="businessName"
          placeholder="Business Name"
          value={formData.businessName}
          onChange={handleChange}
        />

        <input
          name="mapLocation"
          placeholder="Map Location"
          value={formData.mapLocation}
          onChange={handleChange}
        />

        <input
          name="service"
          placeholder="Service"
          value={formData.service}
          onChange={handleChange}
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
        />

        <input
          name="clientEmail"
          placeholder="Client Email"
          value={formData.clientEmail}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Client Password"
          value={formData.password}
          onChange={handleChange}
        />

        {message && <p>{message}</p>}

        <button type="submit" className="btn btn-primary">
          Save
        </button>

        <Link to="/ba" className="btn btn-secondary">
          Back
        </Link>
      </form>
    </div>
  );
};

export default DataSheetPage;