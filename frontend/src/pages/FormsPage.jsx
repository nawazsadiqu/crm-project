import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/forms.css";

const GOOGLE_SERVICE_OPTIONS = [
  "GMB Profile",
  "Photoshoot",
  "Optimization",
  "Page Handling",
  "Contact Number",
  "Suspended Page",
  "Others"
];

const OTHER_SERVICE_OPTIONS = [
  "Google Ads",
  "Website",
  "Social Media Marketing",
  "Meta Ads",
  "Other Services"
];

const FormsPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [successPopupMode, setSuccessPopupMode] = useState("success");
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    revenue: "",
    pincode: "",
    city: "",
    area: "",
    baName: "",
    baId: "",
    businessName: "",
    mobileNumber: "",
    fullName: "",
    address: "",
    gstNumber: "",
    gstInvoiceName: "",
    typeOfBusiness: "",
    typeOfBusinessOther: "",
    googleMapLink: "",
    transactionIdOrChequeNumber: "",
    paymentDetails: "",
    paymentDetailsOther: "",
    serviceCategory: "",
    googleServices: [],
    googleServicesOther: "",
    otherServices: [],
    otherServicesOther: ""
  });

  const [formsData, setFormsData] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const exGst = useMemo(() => {
    const revenueNumber = Number(formData.revenue);
    if (!formData.revenue || Number.isNaN(revenueNumber) || revenueNumber < 0) {
      return "";
    }
    return (revenueNumber / 1.18).toFixed(2);
  }, [formData.revenue]);

  const profitSharing = useMemo(() => {
    const exGstNumber = Number(exGst);
    if (!exGst || Number.isNaN(exGstNumber) || exGstNumber < 0) {
      return "";
    }

    if (formData.serviceCategory === "googleServices") {
      return (exGstNumber * 0.3).toFixed(2);
    }

    if (formData.serviceCategory === "otherServices") {
      return (exGstNumber * 0.15).toFixed(2);
    }

    return "";
  }, [exGst, formData.serviceCategory]);

  const fetchFormsByMonth = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/forms?month=${selectedMonth}`);
      setFormsData(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setFormsData([]);
      setMessage(error.response?.data?.message || "Failed to fetch forms data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProfile = async () => {
    try {
      const { data } = await api.get("/employee-details/my-profile");
      setFormData((prev) => ({
        ...prev,
        baName: data?.name || "",
        baId: data?.employeeId || ""
      }));
    } catch (error) {
      console.error("Failed to fetch BA profile", error);
    }
  };

  useEffect(() => {
    fetchFormsByMonth();
  }, [selectedMonth]);

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (name === "typeOfBusiness" && value !== "Other") {
        updated.typeOfBusinessOther = "";
      }

      if (name === "paymentDetails" && value !== "Other") {
        updated.paymentDetailsOther = "";
      }

      if (name === "serviceCategory") {
        if (value === "googleServices") {
          updated.otherServices = [];
          updated.otherServicesOther = "";
        }

        if (value === "otherServices") {
          updated.googleServices = [];
          updated.googleServicesOther = "";
        }
      }

      return updated;
    });
  };

  const handleServiceCheckboxChange = (fieldName, value) => {
    setFormData((prev) => {
      const currentValues = prev[fieldName];
      const exists = currentValues.includes(value);

      const updatedValues = exists
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      const updated = {
        ...prev,
        [fieldName]: updatedValues
      };

      if (fieldName === "googleServices" && !updatedValues.includes("Others")) {
        updated.googleServicesOther = "";
      }

      if (
        fieldName === "otherServices" &&
        !updatedValues.includes("Other Services")
      ) {
        updated.otherServicesOther = "";
      }

      return updated;
    });
  };

  const resetForm = () => {
    setFormData((prev) => ({
      email: "",
      revenue: "",
      pincode: "",
      city: "",
      area: "",
      baName: prev.baName || "",
      baId: prev.baId || "",
      businessName: "",
      mobileNumber: "",
      fullName: "",
      address: "",
      gstNumber: "",
      gstInvoiceName: "",
      typeOfBusiness: "",
      typeOfBusinessOther: "",
      googleMapLink: "",
      transactionIdOrChequeNumber: "",
      paymentDetails: "",
      paymentDetailsOther: "",
      serviceCategory: "",
      googleServices: [],
      googleServicesOther: "",
      otherServices: [],
      otherServicesOther: ""
    }));
  };

  const handleSave = async () => {
    try {
      if (!selectedDate || !formData.businessName.trim() || formData.revenue === "") {
        setMessage("Please fill date, business name and revenue");
        return;
      }

      if (!formData.serviceCategory) {
        setMessage("Please select service category");
        return;
      }

      if (
        formData.serviceCategory === "googleServices" &&
        formData.googleServices.length === 0
      ) {
        setMessage("Please select at least one Google service");
        return;
      }

      if (
        formData.serviceCategory === "otherServices" &&
        formData.otherServices.length === 0
      ) {
        setMessage("Please select at least one Other service");
        return;
      }

      setMessage("");
setSuccessPopupMode("saving");
setShowSuccessPopup(true);

      await api.post("/forms", {
        date: selectedDate,
        email: formData.email.trim(),
        revenue: Number(formData.revenue),
        pincode: formData.pincode.trim(),
        city: formData.city.trim(),
        area: formData.area.trim(),
        baName: formData.baName,
        baId: formData.baId,
        businessName: formData.businessName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        fullName: formData.fullName.trim(),
        address: formData.address.trim(),
        gstNumber: formData.gstNumber.trim(),
        gstInvoiceName: formData.gstInvoiceName.trim(),
        typeOfBusiness: formData.typeOfBusiness,
        typeOfBusinessOther: formData.typeOfBusinessOther.trim(),
        googleMapLink: formData.googleMapLink.trim(),
        transactionIdOrChequeNumber: formData.transactionIdOrChequeNumber.trim(),
        paymentDetails: formData.paymentDetails,
        paymentDetailsOther: formData.paymentDetailsOther.trim(),
        serviceCategory: formData.serviceCategory,
        googleServices: formData.googleServices,
        googleServicesOther: formData.googleServicesOther.trim(),
        otherServices: formData.otherServices,
        otherServicesOther: formData.otherServicesOther.trim()
      });

      setSuccessPopupMode("success");
resetForm();

setTimeout(() => {
  if (selectedMonth !== selectedDate.slice(0, 7)) {
    setSelectedMonth(selectedDate.slice(0, 7));
  } else {
    fetchFormsByMonth();
  }
}, 100);
} catch (error) {
  setMessage(error.response?.data?.message || "Failed to save form details");
}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/forms/${id}`);
      setMessage("Form record deleted successfully");
      fetchFormsByMonth();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete form record");
    }
  };

  const totals = useMemo(() => {
    return formsData.reduce(
      (acc, item) => {
        acc.revenue += Number(item.revenue || 0);
        acc.exGst += Number(item.exGst || 0);
        acc.profitSharing += Number(item.profitSharing || 0);
        return acc;
      },
      { revenue: 0, exGst: 0, profitSharing: 0 }
    );
  }, [formsData]);

  const formatServices = (services, otherValue, otherLabel) => {
    if (!Array.isArray(services) || services.length === 0) return "-";

    return services
      .map((service) => {
        if (service === otherLabel) {
          return otherValue?.trim() || otherLabel;
        }
        return service;
      })
      .join(", ");
  };

  return (
    <div className="forms-page">
      <div className="forms-page-card">
        <div className="forms-header">
          <div>
            <h2 className="forms-title">Forms</h2>
            <p className="forms-subtitle">
              Save form records and review monthly submissions
            </p>
          </div>
        </div>

        {message && <p className="forms-message">{message}</p>}

        <div className="forms-layout">
          <div className="forms-left-column">
            <div className="forms-section-card">
              <div className="forms-section-header">
                <h3>Basic Details</h3>
              </div>

              <div className="forms-grid two-column">
                <div className="forms-field">
                  <label>Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="forms-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </div>

                <div className="forms-field">
                  <label>Revenue</label>
                  <input
                    type="number"
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleChange}
                    placeholder="Enter revenue"
                    min="0"
                  />
                </div>

                <div className="forms-field">
                  <label>Service Category</label>
                  <select
                    name="serviceCategory"
                    value={formData.serviceCategory}
                    onChange={handleChange}
                  >
                    <option value="">Select service category</option>
                    <option value="googleServices">Google Services</option>
                    <option value="otherServices">Other Services</option>
                  </select>
                </div>

                <div className="forms-field">
                  <label>Ex GST Price</label>
                  <input type="text" value={exGst} readOnly />
                </div>

                <div className="forms-field">
                  <label>Profit Sharing</label>
                  <input type="text" value={profitSharing} readOnly />
                </div>

                <div className="forms-field">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter pincode"
                  />
                </div>

                <div className="forms-field">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                  />
                </div>

                <div className="forms-field">
                <label>Area</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="Enter area"
                />
                </div>

                <div className="forms-field">
                  <label>BA Name</label>
                  <input type="text" name="baName" value={formData.baName} readOnly />
                </div>

                <div className="forms-field">
                  <label>BA ID</label>
                  <input type="text" name="baId" value={formData.baId} readOnly />
                </div>
              </div>
            </div>

            <div className="forms-section-card">
              <div className="forms-section-header">
                <h3>Business Information</h3>
              </div>

              <div className="forms-grid two-column">
                <div className="forms-field">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Enter business name"
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                  />
                </div>

                <div className="forms-field">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="forms-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="forms-field">
                  <label>GST Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                  />
                </div>

                <div className="forms-field">
                  <label>GST Invoice Name</label>
                  <input
                    type="text"
                    name="gstInvoiceName"
                    value={formData.gstInvoiceName}
                    onChange={handleChange}
                    placeholder="Enter GST invoice name"
                  />
                </div>

                <div className="forms-field">
                  <label>Type of Business</label>
                  <select
                    name="typeOfBusiness"
                    value={formData.typeOfBusiness}
                    onChange={handleChange}
                  >
                    <option value="">Select type of business</option>
                    <option value="Proprietor">Proprietor</option>
                    <option value="Partnership">Partnership</option>
                    <option value="PVT LTD">PVT LTD</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.typeOfBusiness === "Other" && (
                  <div className="forms-field">
                    <label>Other Business Type</label>
                    <input
                      type="text"
                      name="typeOfBusinessOther"
                      value={formData.typeOfBusinessOther}
                      onChange={handleChange}
                      placeholder="Enter other business type"
                    />
                  </div>
                )}

                <div className="forms-field full-width">
                  <label>Address</label>
                  <textarea
                    className="forms-textarea"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </div>

                <div className="forms-field full-width">
                  <label>Google Map Link</label>
                  <input
                    type="text"
                    name="googleMapLink"
                    value={formData.googleMapLink}
                    onChange={handleChange}
                    placeholder="Enter Google Map link"
                  />
                </div>
              </div>
            </div>

            <div className="forms-section-card">
              <div className="forms-section-header">
                <h3>Payment Details</h3>
              </div>

              <div className="forms-grid two-column">
                <div className="forms-field">
                  <label>Transaction ID / Cheque Number</label>
                  <input
                    type="text"
                    name="transactionIdOrChequeNumber"
                    value={formData.transactionIdOrChequeNumber}
                    onChange={handleChange}
                    placeholder="Enter transaction ID / cheque number"
                  />
                </div>

                <div className="forms-field">
                  <label>Payment Details</label>
                  <select
                    name="paymentDetails"
                    value={formData.paymentDetails}
                    onChange={handleChange}
                  >
                    <option value="">Select payment mode</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.paymentDetails === "Other" && (
                  <div className="forms-field full-width">
                    <label>Other Payment Details</label>
                    <input
                      type="text"
                      name="paymentDetailsOther"
                      value={formData.paymentDetailsOther}
                      onChange={handleChange}
                      placeholder="Enter other payment details"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="forms-section-card">
              <div className="forms-section-header">
                <h3>Services</h3>
              </div>

              <div className="forms-services-wrap">
                {formData.serviceCategory === "googleServices" && (
                  <div className="forms-service-block">
                    <label className="forms-service-label">Google Services</label>
                    <div className="forms-checkbox-group">
                      {GOOGLE_SERVICE_OPTIONS.map((service) => (
                        <label key={service} className="forms-checkbox-card">
                          <input
                            type="checkbox"
                            checked={formData.googleServices.includes(service)}
                            onChange={() =>
                              handleServiceCheckboxChange("googleServices", service)
                            }
                          />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>

                    {formData.googleServices.includes("Others") && (
                      <div className="forms-field service-other-field">
                        <label>Other Google Service</label>
                        <textarea
                          className="forms-textarea"
                          name="googleServicesOther"
                          value={formData.googleServicesOther}
                          onChange={handleChange}
                          placeholder="Enter other Google service"
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.serviceCategory === "otherServices" && (
                  <div className="forms-service-block">
                    <label className="forms-service-label">Other Services</label>
                    <div className="forms-checkbox-group">
                      {OTHER_SERVICE_OPTIONS.map((service) => (
                        <label key={service} className="forms-checkbox-card">
                          <input
                            type="checkbox"
                            checked={formData.otherServices.includes(service)}
                            onChange={() =>
                              handleServiceCheckboxChange("otherServices", service)
                            }
                          />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>

                    {formData.otherServices.includes("Other Services") && (
                      <div className="forms-field service-other-field">
                        <label>Other Service Details</label>
                        <textarea
                          className="forms-textarea"
                          name="otherServicesOther"
                          value={formData.otherServicesOther}
                          onChange={handleChange}
                          placeholder="Enter other service details"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="forms-actions">
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>

              <Link to="/ba/data-sheet" className="btn btn-secondary">
                Back
              </Link>
            </div>
          </div>

          <div className="forms-right-column">
            <div className="forms-summary-card">
              <h3>Current Entry Summary</h3>

              <div className="forms-summary-row">
                <span>Revenue</span>
                <strong>
                  {formData.revenue ? `₹${Number(formData.revenue).toFixed(2)}` : "-"}
                </strong>
              </div>

              <div className="forms-summary-row">
                <span>Ex GST</span>
                <strong>{exGst ? `₹${exGst}` : "-"}</strong>
              </div>

              <div className="forms-summary-row">
                <span>Profit Sharing</span>
                <strong>{profitSharing ? `₹${profitSharing}` : "-"}</strong>
              </div>

              <div className="forms-summary-row">
                <span>Service Category</span>
                <strong>
                  {formData.serviceCategory === "googleServices"
                    ? "Google Services"
                    : formData.serviceCategory === "otherServices"
                    ? "Other Services"
                    : "-"}
                </strong>
              </div>

              <div className="forms-summary-divider" />

              <div className="forms-summary-row">
                <span>Business</span>
                <strong>{formData.businessName || "-"}</strong>
              </div>

              <div className="forms-summary-row">
                <span>BA Name</span>
                <strong>{formData.baName || "-"}</strong>
              </div>

              <div className="forms-summary-row">
                <span>Selected Date</span>
                <strong>{selectedDate}</strong>
              </div>
            </div>

            <div className="forms-summary-card monthly-totals-card">
              <h3>Monthly Totals</h3>

              <div className="forms-summary-row">
                <span>Total Revenue</span>
                <strong>₹{totals.revenue.toFixed(2)}</strong>
              </div>

              <div className="forms-summary-row">
                <span>Total Ex GST</span>
                <strong>₹{totals.exGst.toFixed(2)}</strong>
              </div>

              <div className="forms-summary-row">
                <span>Total Profit Sharing</span>
                <strong>₹{totals.profitSharing.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="forms-records-section">
          <div className="forms-records-header">
            <div>
              <h3>Monthly Filled Forms</h3>
              <p>Review all saved forms for the selected month</p>
            </div>

            <div className="forms-month-filter">
              <div className="forms-month-box">
                <label>Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={fetchFormsByMonth}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p className="forms-loading">Loading forms data...</p>
          ) : formsData.length === 0 ? (
            <p className="forms-empty">No form records found for this month.</p>
          ) : (
            <div className="forms-table-wrapper">
              <table className="forms-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Email</th>
                    <th>Revenue</th>
                    <th>Ex GST</th>
                    <th>Profit Sharing</th>
                    <th>Service Category</th>
                    <th>Pincode</th>
                    <th>City</th>
                    <th>Area</th>
                    <th>BA Name</th>
                    <th>BA ID</th>
                    <th>Business Name</th>
                    <th>Mobile Number</th>
                    <th>Full Name</th>
                    <th>Address</th>
                    <th>GST Number</th>
                    <th>GST Invoice Name</th>
                    <th>Type of Business</th>
                    <th>Google Map Link</th>
                    <th>Transaction / Cheque</th>
                    <th>Payment Details</th>
                    <th>Google Services</th>
                    <th>Other Services</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {formsData.map((item) => (
                    <tr key={item._id}>
                      <td>{item.date}</td>
                      <td>{item.email || "-"}</td>
                      <td>{Number(item.revenue || 0).toFixed(2)}</td>
                      <td>{Number(item.exGst || 0).toFixed(2)}</td>
                      <td>{Number(item.profitSharing || 0).toFixed(2)}</td>
                      <td>
                        {item.serviceCategory === "googleServices"
                          ? "Google Services"
                          : item.serviceCategory === "otherServices"
                          ? "Other Services"
                          : "-"}
                      </td>
                      <td>{item.pincode || "-"}</td>
                      <td>{item.city || "-"}</td>
                      <td>{item.area || "-"}</td>
                      <td>{item.baName || "-"}</td>
                      <td>{item.baId || "-"}</td>
                      <td>{item.businessName || "-"}</td>
                      <td>{item.mobileNumber || "-"}</td>
                      <td>{item.fullName || "-"}</td>
                      <td>{item.address || "-"}</td>
                      <td>{item.gstNumber || "-"}</td>
                      <td>{item.gstInvoiceName || "-"}</td>
                      <td>
                        {item.typeOfBusiness === "Other"
                          ? item.typeOfBusinessOther || "Other"
                          : item.typeOfBusiness || "-"}
                      </td>
                      <td>{item.googleMapLink || "-"}</td>
                      <td>{item.transactionIdOrChequeNumber || "-"}</td>
                      <td>
                        {item.paymentDetails === "Other"
                          ? item.paymentDetailsOther || "Other"
                          : item.paymentDetails || "-"}
                      </td>
                      <td>
                        {formatServices(
                          item.googleServices,
                          item.googleServicesOther,
                          "Others"
                        )}
                      </td>
                      <td>
                        {formatServices(
                          item.otherServices,
                          item.otherServicesOther,
                          "Other Services"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="2">Total</th>
                    <th>{totals.revenue.toFixed(2)}</th>
                    <th>{totals.exGst.toFixed(2)}</th>
                    <th>{totals.profitSharing.toFixed(2)}</th>
                    <th colSpan="19">-</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
      {showSuccessPopup && (
  <div className="popup-overlay">
    <div className="success-popup">
      <div className="confetti">
  {Array.from({ length: 16 }).map((_, index) => (
    <span key={index}></span>
  ))}
</div>
      <h2>🎉 Congratulations!</h2>
      <p>Form submitted successfully</p>

      <button
        className="btn btn-primary"
        onClick={() => setShowSuccessPopup(false)}
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default FormsPage;