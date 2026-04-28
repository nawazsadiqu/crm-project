import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";
import "../css/adminBusinessDetails.css";

const AdminBusinessDetails = () => {
  const [baList, setBaList] = useState([]);
  const [selectedBa, setSelectedBa] = useState("");
  const [filterType, setFilterType] = useState("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [businessData, setBusinessData] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchBaList();
  }, []);

  useEffect(() => {
    if (selectedBa) {
      fetchBusinessDetails();
    } else {
      setBusinessData([]);
    }
  }, [selectedBa, filterType, date]);

  const fetchBaList = async () => {
    try {
      const res = await axios.get(
        "/api/admin/business-details/ba-list",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setBaList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching BA list:", error);
      setBaList([]);
    }
  };

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);

      let url = `/api/admin/business-details?userId=${selectedBa}&type=${filterType}`;

      if (filterType !== "all") {
        url += `&date=${date}`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setBusinessData(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching business details:", error);
      setBusinessData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderDateInput = () => {
    if (filterType === "daily" || filterType === "weekly") {
      return (
        <input
          className="business-details-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      );
    }

    if (filterType === "monthly") {
      return (
        <input
          className="business-details-input"
          type="month"
          value={date.slice(0, 7)}
          onChange={(e) => setDate(`${e.target.value}-01`)}
        />
      );
    }

    return null;
  };

  const selectedBaDetails = baList.find((ba) => ba.userId === selectedBa);

  const summary = useMemo(() => {
    const totalBusinesses = businessData.length;
    const totalRevenue = businessData.reduce(
      (sum, item) => sum + Number(item.revenue || 0),
      0
    );
    const totalExGst = businessData.reduce(
      (sum, item) => sum + Number(item.exGst || 0),
      0
    );
    const totalProfitSharing = businessData.reduce(
      (sum, item) => sum + Number(item.profitSharing || 0),
      0
    );

    return {
      totalBusinesses,
      totalRevenue,
      totalExGst,
      totalProfitSharing
    };
  }, [businessData]);

  const getServiceDetails = (item) => {
    const googleServices = Array.isArray(item.googleServices)
      ? item.googleServices.filter(Boolean)
      : [];

    const otherServices = Array.isArray(item.otherServices)
      ? item.otherServices.filter(Boolean)
      : [];

    const parts = [];

    if (googleServices.length > 0) {
      parts.push(`Google: ${googleServices.join(", ")}`);
    }

    if (item.googleServicesOther) {
      parts.push(`Google Other: ${item.googleServicesOther}`);
    }

    if (otherServices.length > 0) {
      parts.push(`Other: ${otherServices.join(", ")}`);
    }

    if (item.otherServicesOther) {
      parts.push(`Other Service Details: ${item.otherServicesOther}`);
    }

    return parts.length > 0 ? parts.join(" | ") : "-";
  };

  return (
    <div className="business-details-container">
      <div className="business-details-topbar">
        <div>
          <h1 className="business-details-title">Business Details</h1>
          <p className="business-details-subtitle">
            View BA-wise business forms and service details
          </p>
        </div>

        <div className="business-details-filters">
          <select
            value={selectedBa}
            onChange={(e) => setSelectedBa(e.target.value)}
            className="business-details-select"
          >
            <option value="">Select BA</option>
            {baList.map((ba) => (
              <option key={ba.employeeId} value={ba.userId}>
                {ba.employeeId} - {ba.name.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="business-details-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all">All Time</option>
          </select>

          {renderDateInput()}
        </div>
      </div>

      {!selectedBa ? (
        <div className="business-details-empty">Please select a BA</div>
      ) : loading ? (
        <div className="business-details-empty">Loading...</div>
      ) : (
        <>
          <div className="business-details-header-card">
            <div>
              <h3 className="business-details-ba-name">
                {selectedBaDetails?.employeeId} - {selectedBaDetails?.name?.toUpperCase()}
              </h3>
              <p className="business-details-ba-role">Business Summary</p>
            </div>

            <span className="business-details-badge">
              {filterType === "all" ? "All Time" : filterType}
            </span>
          </div>

          <div className="business-details-summary-grid">
            <div className="business-summary-card">
              <p className="business-summary-title">Total Businesses</p>
              <h3 className="business-summary-value">{summary.totalBusinesses}</h3>
            </div>

            <div className="business-summary-card">
              <p className="business-summary-title">Total Revenue</p>
              <h3 className="business-summary-value">₹ {Number(summary.totalRevenue || 0).toLocaleString("en-IN", {maximumFractionDigits: 0})}</h3>
            </div>

            <div className="business-summary-card">
              <p className="business-summary-title">Total Ex GST</p>
              <h3 className="business-summary-value">₹ {Number(summary.totalExGst || 0).toLocaleString("en-IN", {maximumFractionDigits: 0})}</h3>
            </div>

            <div className="business-summary-card">
              <p className="business-summary-title">Total Profit Sharing</p>
              <h3 className="business-summary-value">₹ {Number(summary.totalProfitSharing || 0).toLocaleString("en-IN", {maximumFractionDigits: 0})}</h3>
            </div>
          </div>

          {businessData.length === 0 ? (
            <div className="business-details-empty">No business data found</div>
          ) : (
            <div className="business-details-table-wrap">
              <table className="business-details-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Business Name</th>
                    <th>Full Name</th>
                    <th>Mobile Number</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Area</th>
                    <th>Address</th>
                    <th>Type Of Business</th>
                    <th>Service Details</th>
                    <th>Revenue</th>
                    <th>Ex GST</th>
                    <th>Profit Sharing</th>
                  </tr>
                </thead>
                <tbody>
                  {businessData.map((item) => (
                    <tr key={item._id}>
                      <td>{item.date || "-"}</td>
                      <td>{item.businessName || "-"}</td>
                      <td>{item.fullName || "-"}</td>
                      <td>{item.mobileNumber || "-"}</td>
                      <td>{item.email || "-"}</td>
                      <td>{item.city || "-"}</td>
                      <td>{item.area || "-"}</td>
                      <td>{item.address || "-"}</td>
                      <td>
                        {item.typeOfBusiness === "Other"
                          ? item.typeOfBusinessOther || "Other"
                          : item.typeOfBusiness || "-"}
                      </td>
                      <td>{getServiceDetails(item)}</td>
                      <td>{item.revenue || 0}</td>
                      <td>{item.exGst || 0}</td>
                      <td>{item.profitSharing || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBusinessDetails;