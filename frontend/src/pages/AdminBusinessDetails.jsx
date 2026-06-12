import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";
import "../css/adminBusinessDetails.css";
import * as XLSX from "xlsx";

const AdminBusinessDetails = () => {
  const [baList, setBaList] = useState([]);
  const [selectedBa, setSelectedBa] = useState("all");
  const [filterType, setFilterType] = useState("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [businessData, setBusinessData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchBaList();
  }, []);

  useEffect(() => {
  fetchBusinessDetails();
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

      let url = `/api/admin/business-details?type=${filterType}`;

if (selectedBa !== "all") {
  url += `&userId=${selectedBa}`;
}

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

  const filteredBusinessData = useMemo(() => {
  if (paymentFilter === "all") {
    return businessData;
  }

  return businessData.filter(
    (item) => (item.paymentDetails || "") === paymentFilter
  );
}, [businessData, paymentFilter]);

  const summary = useMemo(() => {
    const totalBusinesses = filteredBusinessData.length;
    const totalRevenue = filteredBusinessData.reduce(
      (sum, item) => sum + Number(item.revenue || 0),
      0
    );
    const totalExGst = filteredBusinessData.reduce(
      (sum, item) => sum + Number(item.exGst || 0),
      0
    );
    const totalProfitSharing = filteredBusinessData.reduce(
      (sum, item) => sum + Number(item.profitSharing || 0),
      0
    );

    let filteredData = [...businessData];

if (paymentFilter !== "all") {
  filteredData = filteredData.filter(
    (item) => (item.paymentDetails || "") === paymentFilter
  );
}

    return {
      totalBusinesses,
      totalRevenue,
      totalExGst,
      totalProfitSharing
    };
  }, [filteredBusinessData]);

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

  const handleDownloadExcel = () => {
  const excelData = filteredBusinessData.map((item, index) => ({
    "S.No": index + 1,
    Date: item.date || "-",
    "BA Name": item.baName || item.employeeName || item.userName || "-",
    "Business Name": item.businessName || "-",
    "Full Name": item.fullName || "-",
    "Mobile Number": item.mobileNumber || "-",
    Email: item.email || "-",
    City: item.city || "-",
    Area: item.area || "-",
    Pincode: item.pincode || "-",
    "GST Number": item.gstNumber || "-",
    "GST Invoice Name": item.gstInvoiceName || "-",
    "Map Link": item.googleMapLink || "-",
    Address: item.address || "-",
    "Type Of Business":
      item.typeOfBusiness === "Other"
        ? item.typeOfBusinessOther || "Other"
        : item.typeOfBusiness || "-",
    "Service Details": getServiceDetails(item),
    "Type Of Payment": item.paymentDetails || "-",
    "Transaction ID / Cheque Number":
  item.transactionIdOrChequeNumber || "-",
    Revenue: Number(item.revenue || 0),
    "Ex GST": Number(item.exGst || 0),
    "Profit Sharing": Number(item.profitSharing || 0)
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Business Details");

  const fileName =
    filterType === "all"
      ? "business-details-all.xlsx"
      : `business-details-${filterType}-${date}.xlsx`;

  XLSX.writeFile(workbook, fileName);
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
            <option value="all">All</option>
            {baList.map((ba) => (
              <option key={ba.employeeId} value={ba.userId}>
                {ba.employeeId} - {ba.name.toUpperCase()}
              </option>
            ))}
          </select>

          <select
  value={paymentFilter}
  onChange={(e) => setPaymentFilter(e.target.value)}
  className="business-details-select"
>
  <option value="all">All Payments</option>
  <option value="Cheque">Cheque</option>
  <option value="UPI">UPI</option>
  <option value="RTGS">RTGS</option>
  <option value="NEFT">NEFT</option>
  <option value="Other">Other</option>
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

      {loading ? (
        <div className="business-details-empty">Loading...</div>
      ) : (
        <>
          <div className="business-details-header-card">
            <div>
              <h3 className="business-details-ba-name">
                {selectedBa === "all"
                  ? "ALL BA"
                  : `${selectedBaDetails?.employeeId} - ${selectedBaDetails?.name?.toUpperCase()}`}
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

          {filteredBusinessData.length === 0 ? (
            <div className="business-details-empty">No business data found</div>
          ) : (
            <div className="business-details-table-wrap">
              <table className="business-details-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>BA Name</th>
                    <th>Business Name</th>
                    <th>Full Name</th>
                    <th>Mobile Number</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Area</th>
                    <th>Address</th>
                    <th>Pincode</th>
                    <th>Map Link</th>
                    <th>Type Of Business</th>
                    <th>Service Details</th>
                    <th>Type Of Payment</th>
                    <th>Transaction ID / Cheque Number</th>
                    <th>Revenue</th>
                    <th>Ex GST</th>
                    <th>Profit Sharing</th>
                    <th>GST Number</th>
                    <th>GST Invoice Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinessData.map((item) => (
                    <tr key={item._id}>
                      <td>{item.date || "-"}</td>
                      <td>{item.baName || item.employeeName || item.userName || "-"}</td>
                      <td>{item.businessName || "-"}</td>
                      <td>{item.fullName || "-"}</td>
                      <td>{item.mobileNumber || "-"}</td>
                      <td>{item.email || "-"}</td>
                      <td>{item.city || "-"}</td>
                      <td>{item.area || "-"}</td>
                      <td>{item.address || "-"}</td>
                      <td>{item.pincode || "-"}</td>
                      <td>
                        {item.googleMapLink ? (
                          <a href={item.googleMapLink} target="_blank" rel="noreferrer">
                            Open Map
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {item.typeOfBusiness === "Other"
                          ? item.typeOfBusinessOther || "Other"
                          : item.typeOfBusiness || "-"}
                      </td>
                      <td>{getServiceDetails(item)}</td>
                      <td>{item.paymentDetails || "-"}</td>
                      <td>{item.transactionIdOrChequeNumber || "-"}</td>
                      <td>{item.revenue || 0}</td>
                      <td>{item.exGst || 0}</td>
                      <td>{item.profitSharing || 0}</td>
                      <td>{item.gstNumber || "-"}</td>
                      <td>{item.gstInvoiceName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          )}<button
  type="button"
  className="btn btn-primary"
  onClick={handleDownloadExcel}
>
  Download Excel
</button>
        </>
      )}
    </div>
  );
};

export default AdminBusinessDetails;