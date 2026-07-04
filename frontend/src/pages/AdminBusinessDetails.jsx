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
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

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

  const formatCurrency = (value) => {
  return `₹ ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
};

const getPaymentTypeLabel = (item) => {
  if (item.paymentType === "partial") return "Partial";
  if (item.paymentType === "additional") return "Additional";
  return "Complete";
};

const getPaymentList = (item) => {
  const mainPayment = {
    label: "1st",
    date: item.date || item.paymentDate || "",
    amount: item.amountReceivedNow || item.revenue || 0,
    transactionIdOrChequeNumber:
      item.transactionIdOrChequeNumber ||
      item.transactionId ||
      item.utrNumber ||
      "",
    paymentDetails:
      item.paymentDetails === "Other"
        ? item.paymentDetailsOther || "Other"
        : item.paymentDetails || "-"
  };

  const historyPayments = Array.isArray(item.paymentHistory)
    ? item.paymentHistory
    : [];

  const mappedHistoryPayments = historyPayments.map((payment, index) => {
    const paymentNumber = index + 2;

    const suffix =
      paymentNumber === 2
        ? "nd"
        : paymentNumber === 3
        ? "rd"
        : "th";

    return {
      label: `${paymentNumber}${suffix}`,
      date:
        payment.paymentDate ||
        payment.date ||
        payment.createdAt?.slice?.(0, 10) ||
        "",
      amount:
        payment.amount ||
        payment.revenue ||
        payment.amountReceivedNow ||
        0,
      transactionIdOrChequeNumber:
        payment.transactionIdOrChequeNumber ||
        payment.transactionId ||
        payment.utrNumber ||
        "",
      paymentDetails:
        payment.paymentDetails === "Other"
          ? payment.paymentDetailsOther || "Other"
          : payment.paymentDetails || payment.paymentMode || "-"
    };
  });

  return [mainPayment, ...mappedHistoryPayments].filter(
    (payment) =>
      payment.date ||
      Number(payment.amount || 0) > 0 ||
      payment.transactionIdOrChequeNumber ||
      payment.paymentDetails
  );
};

const getPaymentDatesText = (item) => {
  const payments = getPaymentList(item);

  if (payments.length === 0) return "-";

  return payments
    .map((payment) => `${payment.label}: ${payment.date || "-"}`)
    .join(" | ");
};

const getPaymentModesText = (item) => {
  const payments = getPaymentList(item);

  if (payments.length === 0) return "-";

  return payments
    .map((payment) => `${payment.label}: ${payment.paymentDetails || "-"}`)
    .join(" | ");
};

const getPaymentTransactionsText = (item) => {
  const payments = getPaymentList(item);

  if (payments.length === 0) return "-";

  return payments
    .map(
      (payment) =>
        `${payment.label}: ${payment.date || "-"} | ${
          payment.paymentDetails || "-"
        } | ${formatCurrency(payment.amount)} | ${
          payment.transactionIdOrChequeNumber || "-"
        }`
    )
    .join(" | ");
};

const renderPaymentTransactions = (item) => {
  const payments = getPaymentList(item);

  if (payments.length === 0) {
    return "-";
  }

  return (
    <div className="business-payment-history-cell">
      {payments.map((payment) => (
        <div
          key={`${payment.label}-${payment.transactionIdOrChequeNumber || payment.date}`}
        >
          <strong>{payment.label} Payment</strong>
          <span>Date: {payment.date || "-"}</span>
          <span>Mode: {payment.paymentDetails || "-"}</span>
          <span>Amount: {formatCurrency(payment.amount)}</span>
          <span>UTR / Cheque: {payment.transactionIdOrChequeNumber || "-"}</span>
        </div>
      ))}
    </div>
  );
};

  const selectedBaDetails = baList.find((ba) => ba.userId === selectedBa);

  const filteredBusinessData = useMemo(() => {
  if (paymentFilter === "all") {
    return businessData;
  }

  return businessData.filter((item) =>
    getPaymentList(item).some(
      (payment) => (payment.paymentDetails || "") === paymentFilter
    )
  );
}, [businessData, paymentFilter]);

useEffect(() => {
  if (filteredBusinessData.length === 0) {
    setSelectedBusinessId("");
    return;
  }

  const exists = filteredBusinessData.some(
    (item) => item._id === selectedBusinessId
  );

  if (!exists) {
    setSelectedBusinessId(filteredBusinessData[0]._id);
  }
}, [filteredBusinessData, selectedBusinessId]);

const selectedBusiness = useMemo(() => {
  return (
    filteredBusinessData.find((item) => item._id === selectedBusinessId) ||
    filteredBusinessData[0] ||
    null
  );
}, [filteredBusinessData, selectedBusinessId]);

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

    const totalPackageAmount = filteredBusinessData.reduce(
  (sum, item) => sum + Number(item.packageAmount || item.revenue || 0),
  0
);

const totalBalanceAmount = filteredBusinessData.reduce(
  (sum, item) => sum + Number(item.balanceAmount || 0),
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
  totalProfitSharing,
  totalPackageAmount,
  totalBalanceAmount
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

  "Payment Type": getPaymentTypeLabel(item),
  "Package Amount": Number(item.packageAmount || item.revenue || 0),
  "Total Received Amount": Number(
    item.totalReceivedAmount || item.revenue || 0
  ),
  "Balance Amount": Number(item.balanceAmount || 0),
  "Payment Status": item.paymentStatus || "Paid",

  "Payment Dates": getPaymentDatesText(item),
  "Payment Modes": getPaymentModesText(item),
  "All Transaction / UTR / Cheque Numbers": getPaymentTransactionsText(item),

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
  <p className="business-summary-title">Total Package Amount</p>
  <h3 className="business-summary-value">
    ₹ {Number(summary.totalPackageAmount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0
    })}
  </h3>
</div>

<div className="business-summary-card">
  <p className="business-summary-title">Total Balance</p>
  <h3 className="business-summary-value">
    ₹ {Number(summary.totalBalanceAmount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0
    })}
  </h3>
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
            <div className="business-details-split-layout">
  <div className="business-details-list-panel">
    <div className="business-details-list-header">
      <h3>Business List</h3>
      <p>Select a business to view full details</p>
    </div>

    <div className="business-details-mini-list">
      {filteredBusinessData.map((item) => (
        <div
          key={item._id}
          className={`business-mini-card ${
            selectedBusinessId === item._id ? "active" : ""
          }`}
        >
          <div className="business-mini-info">
            <span className="business-mini-date">{item.date || "-"}</span>

            <h4>{item.businessName || "-"}</h4>

            <p>
              BA: {item.baName || item.employeeName || item.userName || "-"}
            </p>

            <p>Number: {item.mobileNumber || "-"}</p>
          </div>

          <button
            type="button"
            className="business-mini-btn"
            onClick={() => setSelectedBusinessId(item._id)}
          >
            See Details
          </button>
        </div>
      ))}
    </div>
  </div>

  <div className="business-details-full-panel">
    {!selectedBusiness ? (
      <div className="business-details-empty">
        Select a business to view details
      </div>
    ) : (
      <>
        <div className="business-full-header">
          <div>
            <span>{selectedBusiness.date || "-"}</span>
            <h3>{selectedBusiness.businessName || "-"}</h3>
            <p>
              {selectedBusiness.baName ||
                selectedBusiness.employeeName ||
                selectedBusiness.userName ||
                "-"}
            </p>
          </div>

          <div className="business-status-pill">
            {selectedBusiness.paymentStatus || "Paid"}
          </div>
        </div>

        <div className="business-details-info-grid">
          <div className="business-info-box">
            <span>Full Name</span>
            <strong>{selectedBusiness.fullName || "-"}</strong>
          </div>

          <div className="business-info-box">
            <span>Mobile Number</span>
            <strong>{selectedBusiness.mobileNumber || "-"}</strong>
          </div>

          <div className="business-info-box">
            <span>Email</span>
            <strong>{selectedBusiness.email || "-"}</strong>
          </div>

          <div className="business-info-box">
            <span>City</span>
            <strong>{selectedBusiness.city || "-"}</strong>
          </div>

          <div className="business-info-box">
            <span>Area</span>
            <strong>{selectedBusiness.area || "-"}</strong>
          </div>

          <div className="business-info-box">
            <span>Pincode</span>
            <strong>{selectedBusiness.pincode || "-"}</strong>
          </div>

          <div className="business-info-box">
            <span>Type Of Business</span>
            <strong>
              {selectedBusiness.typeOfBusiness === "Other"
                ? selectedBusiness.typeOfBusinessOther || "Other"
                : selectedBusiness.typeOfBusiness || "-"}
            </strong>
          </div>

          <div className="business-info-box">
            <span>Map Link</span>
            {selectedBusiness.googleMapLink ? (
              <a
                href={selectedBusiness.googleMapLink}
                target="_blank"
                rel="noreferrer"
              >
                Open Map
              </a>
            ) : (
              <strong>-</strong>
            )}
          </div>
        </div>

        <div className="business-details-section-box">
          <h4>Payment Details</h4>

          <div className="business-details-info-grid">
            <div className="business-info-box">
              <span>Payment Type</span>
              <strong>{getPaymentTypeLabel(selectedBusiness)}</strong>
            </div>

            <div className="business-info-box">
              <span>Package Amount</span>
              <strong>
                {formatCurrency(
                  selectedBusiness.packageAmount || selectedBusiness.revenue || 0
                )}
              </strong>
            </div>

            <div className="business-info-box">
              <span>Total Received</span>
              <strong>
                {formatCurrency(
                  selectedBusiness.totalReceivedAmount ||
                    selectedBusiness.revenue ||
                    0
                )}
              </strong>
            </div>

            <div className="business-info-box">
              <span>Balance</span>
              <strong>
                {formatCurrency(selectedBusiness.balanceAmount || 0)}
              </strong>
            </div>

            <div className="business-info-box">
              <span>Revenue</span>
              <strong>{formatCurrency(selectedBusiness.revenue || 0)}</strong>
            </div>

            <div className="business-info-box">
              <span>Ex GST</span>
              <strong>{formatCurrency(selectedBusiness.exGst || 0)}</strong>
            </div>

            <div className="business-info-box">
              <span>Profit Sharing</span>
              <strong>
                {formatCurrency(selectedBusiness.profitSharing || 0)}
              </strong>
            </div>

            <div className="business-info-box">
              <span>Payment Status</span>
              <strong>{selectedBusiness.paymentStatus || "Paid"}</strong>
            </div>
          </div>

          <div className="business-details-wide-box">
            <span>All Payment Transactions</span>
            <div>{renderPaymentTransactions(selectedBusiness)}</div>
          </div>
        </div>

        <div className="business-details-section-box">
          <h4>Service Details</h4>

          <div className="business-details-wide-box">
            <span>Combined Service Details</span>
            <strong>{getServiceDetails(selectedBusiness)}</strong>
          </div>
        </div>

        <div className="business-details-section-box">
          <h4>GST & Address Details</h4>

          <div className="business-details-info-grid">
            <div className="business-info-box">
              <span>GST Number</span>
              <strong>{selectedBusiness.gstNumber || "-"}</strong>
            </div>

            <div className="business-info-box">
              <span>GST Invoice Name</span>
              <strong>{selectedBusiness.gstInvoiceName || "-"}</strong>
            </div>
          </div>

          <div className="business-details-wide-box">
            <span>Address</span>
            <strong>{selectedBusiness.address || "-"}</strong>
          </div>
        </div>
      </>
    )}
  </div>
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