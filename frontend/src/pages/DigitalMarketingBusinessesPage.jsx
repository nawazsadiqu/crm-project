import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/digitalBusinesses.css";

const formatOtherServices = (services, otherText) => {
  if (!Array.isArray(services) || services.length === 0) return "-";

  return services
    .map((service) => {
      if (service === "Other Services") {
        return otherText?.trim() || "Other Services";
      }
      return service;
    })
    .join(", ");
};

const DigitalMarketingBusinessesPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [message, setMessage] = useState("");

  const fetchBusinesses = async () => {
    try {
      const { data } = await api.get("/digital-marketing/businesses");
      setBusinesses(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch digital marketing businesses"
      );
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  return (
    <div className="digital-business-page">
      <div className="digital-business-card">

        {/* HEADER */}
        <div className="digital-business-header">
          <div>
            <h2>Digital Marketing Business Details</h2>
            <p>All businesses assigned for digital marketing services</p>
          </div>

          <button className="btn btn-secondary" onClick={fetchBusinesses}>
            Refresh
          </button>
        </div>

        {message && (
          <p className="digital-business-message">{message}</p>
        )}

        {/* TABLE */}
        {businesses.length === 0 ? (
          <p className="digital-business-empty">
            No digital marketing businesses found.
          </p>
        ) : (
          <div className="digital-business-table-wrapper">
            <table className="digital-business-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>BA Name</th>
                  <th>BA ID</th>
                  <th>Services</th>
                </tr>
              </thead>

              <tbody>
                {businesses.map((item) => (
                  <tr key={item._id}>
                    <td>{item.date || "-"}</td>
                    <td>{item.businessName || "-"}</td>
                    <td>{item.fullName || "-"}</td>
                    <td>{item.mobileNumber || "-"}</td>
                    <td>{item.email || "-"}</td>
                    <td>{item.city || "-"}</td>
                    <td>{item.baName || "-"}</td>
                    <td>{item.baId || "-"}</td>
                    <td className="service-cell">
                      {formatOtherServices(
                        item.otherServices,
                        item.otherServicesOther
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalMarketingBusinessesPage;