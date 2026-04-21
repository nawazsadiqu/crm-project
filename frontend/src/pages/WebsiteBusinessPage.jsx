import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/websiteBusinesses.css";

const WebsiteBusinessesPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [message, setMessage] = useState("");

  const fetchBusinesses = async () => {
    try {
      const { data } = await api.get("/website-developer/businesses");
      setBusinesses(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch website businesses"
      );
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  return (
    <div className="website-business-page">
      <div className="website-business-card">
        
        {/* HEADER */}
        <div className="website-business-header">
          <div>
            <h2 className="website-business-title">
              Website Business Data
            </h2>
            <p className="website-business-subtitle">
              View all businesses assigned for website development
            </p>
          </div>

          <button className="btn btn-secondary" onClick={fetchBusinesses}>
            Refresh
          </button>
        </div>

        {message && (
          <p className="website-business-message">{message}</p>
        )}

        {/* TABLE */}
        {businesses.length === 0 ? (
          <p className="website-business-empty">
            No website business data found.
          </p>
        ) : (
          <div className="website-business-table-wrapper">
            <table className="website-business-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Business Name</th>
                  <th>Full Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Address</th>
                  <th>GST</th>
                  <th>Map Link</th>
                  <th>BA Name</th>
                  <th>BA ID</th>
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
                    <td>{item.address || "-"}</td>
                    <td>{item.gstNumber || "-"}</td>
                    <td>
                      {item.googleMapLink ? (
                        <a
                          href={item.googleMapLink}
                          target="_blank"
                          rel="noreferrer"
                          className="table-link"
                        >
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{item.baName || "-"}</td>
                    <td>{item.baId || "-"}</td>
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

export default WebsiteBusinessesPage;