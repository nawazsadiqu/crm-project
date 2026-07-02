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
    paymentType: "complete",
    packageAmount: "",
    parentFormId: "",
    previousReceivedAmount: 0,
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);

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

  const calculatedBalance = useMemo(() => {
  const receivedAmount = Number(formData.revenue || 0);

  const packageAmount =
    formData.paymentType === "complete"
      ? receivedAmount
      : Number(formData.packageAmount || 0);

  const previousReceivedAmount =
    formData.paymentType === "additional"
      ? Number(formData.previousReceivedAmount || 0)
      : 0;

  if (!packageAmount || Number.isNaN(packageAmount)) {
    return "";
  }

  const balance = packageAmount - previousReceivedAmount - receivedAmount;

  return balance > 0 ? balance.toFixed(2) : "0.00";
}, [
  formData.paymentType,
  formData.packageAmount,
  formData.revenue,
  formData.previousReceivedAmount
]);

  const currentPaymentStatus = useMemo(() => {
  const balance = Number(calculatedBalance || 0);
  return balance > 0 ? "Partially Paid" : "Paid";
    }, [calculatedBalance]);

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

  const preventNumberScroll = (e) => {
  e.currentTarget.blur();
};

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (name === "paymentType" && value === "complete") {
        updated.packageAmount = updated.revenue || "";
        updated.parentFormId = "";
      }

      if (name === "revenue" && updated.paymentType === "complete") {
        updated.packageAmount = value;
      }

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
      paymentType: "complete",
      packageAmount: "",
      parentFormId: "",
      previousReceivedAmount: 0,
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

  const validateForm = () => {
  const newErrors = {};

  const requiredFields = {
    email: "Email is required",
    revenue: "Revenue is required",
    paymentType: "Payment type is required",
    pincode: "Pincode is required",
    city: "City is required",
    area: "Area is required",
    businessName: "Business name is required",
    mobileNumber: "Mobile number is required",
    fullName: "Full name is required",
    address: "Address is required",
    gstNumber: "GST number is required",
    gstInvoiceName: "GST invoice name is required",
    typeOfBusiness: "Type of business is required",
    googleMapLink: "Google map link is required",
    transactionIdOrChequeNumber: "Transaction ID / Cheque number is required",
    paymentDetails: "Payment details is required",
    serviceCategory: "Service category is required"
  };

  Object.entries(requiredFields).forEach(([field, message]) => {
    if (!formData[field]?.toString().trim()) {
      newErrors[field] = message;
    }
  });

  if (!selectedDate) {
    newErrors.selectedDate = "Date is required";
  }

  if (
  (formData.paymentType === "partial" ||
    formData.paymentType === "additional") &&
  !formData.packageAmount?.toString().trim()
) {
  newErrors.packageAmount = "Package amount is required";
}

if (
  formData.paymentType === "partial" ||
  formData.paymentType === "additional"
) {
  const packageAmountNumber = Number(formData.packageAmount || 0);
  const receivedAmountNumber = Number(formData.revenue || 0);

  if (packageAmountNumber <= 0) {
    newErrors.packageAmount = "Package amount must be greater than 0";
  }

  if (receivedAmountNumber <= 0) {
    newErrors.revenue = "Payment received amount must be greater than 0";
  }

  const previousReceivedAmountNumber =
  formData.paymentType === "additional"
    ? Number(formData.previousReceivedAmount || 0)
    : 0;

const remainingAmount =
  packageAmountNumber - previousReceivedAmountNumber;

if (receivedAmountNumber > remainingAmount) {
  newErrors.revenue =
    "Payment received cannot be greater than balance amount";
}
}

  if (formData.typeOfBusiness === "Other" && !formData.typeOfBusinessOther.trim()) {
    newErrors.typeOfBusinessOther = "Other business type is required";
  }

  if (formData.paymentDetails === "Other" && !formData.paymentDetailsOther.trim()) {
    newErrors.paymentDetailsOther = "Other payment details is required";
  }

  if (
    formData.serviceCategory === "googleServices" &&
    formData.googleServices.length === 0
  ) {
    newErrors.googleServices = "Please select at least one Google service";
  }

  if (
    formData.googleServices.includes("Others") &&
    !formData.googleServicesOther.trim()
  ) {
    newErrors.googleServicesOther = "Other Google service is required";
  }

  if (
    formData.serviceCategory === "otherServices" &&
    formData.otherServices.length === 0
  ) {
    newErrors.otherServices = "Please select at least one Other service";
  }

  if (
    formData.otherServices.includes("Other Services") &&
    !formData.otherServicesOther.trim()
  ) {
    newErrors.otherServicesOther = "Other service details is required";
  }

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    setMessage("Please fill all mandatory fields. Form is not saved.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return false;
  }

  setMessage("");
  return true;
};

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      

      setMessage("");
      setSuccessPopupMode("saving");
      setShowSuccessPopup(true);

      const payload = {
  date: selectedDate,
  email: formData.email.trim(),
  revenue: Number(formData.revenue),
  paymentType: formData.paymentType,
  packageAmount:
  formData.paymentType === "complete"
    ? Number(formData.revenue)
    : Number(formData.packageAmount),
  parentFormId: formData.parentFormId || "",
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
};

let response;

if (editingId) {
  response = await api.put(`/forms/${editingId}`, payload);
} else {
  response = await api.post("/forms", payload);
}

if (response?.data?.requiresAdminApproval) {
  setSuccessPopupMode("pending");
  setShowSuccessPopup(true);
  setErrors({});
  setMessage("");
  resetForm();
  return;
}

setSuccessPopupMode("success");
setErrors({});
resetForm();
setEditingId(null);

setTimeout(() => {
  if (selectedMonth !== selectedDate.slice(0, 7)) {
    setSelectedMonth(selectedDate.slice(0, 7));
  } else {
    fetchFormsByMonth();
  }
}, 100);
} catch (error) {
  setShowSuccessPopup(false);
  setMessage(error.response?.data?.message || "Failed to save form details");
}
  };

  const handleEdit = (item) => {
  setErrors({});
  setMessage("");
  setEditingId(item._id);
  setSelectedDate(item.date || today);

  setFormData({
    email: item.email || "",
    revenue: item.revenue || "",
    paymentType: item.paymentType || "complete",
    packageAmount: item.packageAmount || item.revenue || "",
    previousReceivedAmount: Number(item.totalReceivedAmount || item.revenue || 0),
    parentFormId: item.parentFormId || "",
    pincode: item.pincode || "",
    city: item.city || "",
    area: item.area || "",
    baName: item.baName || "",
    baId: item.baId || "",
    businessName: item.businessName || "",
    mobileNumber: item.mobileNumber || "",
    fullName: item.fullName || "",
    address: item.address || "",
    gstNumber: item.gstNumber || "",
    gstInvoiceName: item.gstInvoiceName || "",
    typeOfBusiness: item.typeOfBusiness || "",
    typeOfBusinessOther: item.typeOfBusinessOther || "",
    googleMapLink: item.googleMapLink || "",
    transactionIdOrChequeNumber: item.transactionIdOrChequeNumber || "",
    paymentDetails: item.paymentDetails || "",
    paymentDetailsOther: item.paymentDetailsOther || "",
    serviceCategory: item.serviceCategory || "",
    googleServices: item.googleServices || [],
    googleServicesOther: item.googleServicesOther || "",
    otherServices: item.otherServices || [],
    otherServicesOther: item.otherServicesOther || ""
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleAddPayment = (item) => {
  setErrors({});
  setMessage("");
  setEditingId(item._id);

  setSelectedDate(today);

  setFormData({
    email: item.email || "",
    revenue: "",
    paymentType: "additional",
    packageAmount: item.packageAmount || item.revenue || "",
    previousReceivedAmount: Number(
    item.totalReceivedAmount ||
      item.amountReceivedNow ||
      item.revenue ||
      0
     ),
    pincode: item.pincode || "",
    city: item.city || "",
    area: item.area || "",
    baName: item.baName || "",
    baId: item.baId || "",
    businessName: item.businessName || "",
    mobileNumber: item.mobileNumber || "",
    fullName: item.fullName || "",
    address: item.address || "",
    gstNumber: item.gstNumber || "",
    gstInvoiceName: item.gstInvoiceName || "",
    typeOfBusiness: item.typeOfBusiness || "",
    typeOfBusinessOther: item.typeOfBusinessOther || "",
    googleMapLink: item.googleMapLink || "",
    transactionIdOrChequeNumber: "",
    paymentDetails: "",
    paymentDetailsOther: "",
    serviceCategory: item.serviceCategory || "",
    googleServices: item.googleServices || [],
    googleServicesOther: item.googleServicesOther || "",
    otherServices: item.otherServices || [],
    otherServicesOther: item.otherServicesOther || ""
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
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

  const formatPaymentTransactions = (item) => {
  const payments = [
    {
      label: "1st",
      date: item.date,
      amount: item.amountReceivedNow || item.revenue,
      transactionIdOrChequeNumber: item.transactionIdOrChequeNumber,
      paymentDetails: item.paymentDetails
    },
    ...(Array.isArray(item.paymentHistory) ? item.paymentHistory : []).map(
      (payment, index) => ({
        label: `${index + 2}${index + 2 === 2 ? "nd" : "th"}`,
        date: payment.paymentDate,
        amount: payment.amount,
        transactionIdOrChequeNumber: payment.transactionIdOrChequeNumber,
        paymentDetails: payment.paymentDetails
      })
    )
  ];

  return payments
    .filter((payment) => payment.transactionIdOrChequeNumber)
    .map((payment) => (
      <div key={`${payment.label}-${payment.transactionIdOrChequeNumber}`}>
        <strong>{payment.label}:</strong> {payment.date || "-"} | ₹
        {Number(payment.amount || 0).toFixed(2)} |{" "}
        {payment.transactionIdOrChequeNumber || "-"}
      </div>
    ));
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
  className={errors.selectedDate ? "input-error" : ""}
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
/>

{errors.selectedDate && (
  <small className="field-error">
    {errors.selectedDate}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>Email</label>
                  <input
  className={errors.email ? "input-error" : ""}
  type="email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  placeholder="Enter email"
/>

{errors.email && (
  <small className="field-error">
    {errors.email}
  </small>
)}
                </div>

                <div className="forms-field">
  <label>Payment Type</label>
  <select
    className={errors.paymentType ? "input-error" : ""}
    name="paymentType"
    value={formData.paymentType}
    onChange={handleChange}
    disabled={formData.paymentType === "additional"}
  >
    <option value="complete">Complete Payment</option>
    <option value="partial">Partial Payment</option>
    <option value="additional">Additional Payment</option>
  </select>

  {errors.paymentType && (
    <small className="field-error">{errors.paymentType}</small>
  )}
</div>

                <div className="forms-field">
                  <label>
  {formData.paymentType === "complete"
    ? "Revenue"
    : "Payment Received Now"}
</label>
                  <input
  className={errors.revenue ? "input-error" : ""}
  type="number"
  name="revenue"
  value={formData.revenue}
  onChange={handleChange}
  onWheel={preventNumberScroll}
  placeholder="Enter revenue"
  min="0"
/>

{errors.revenue && (
  <small className="field-error">
    {errors.revenue}
  </small>
)}
                </div>

                {formData.paymentType !== "complete" && (
  <>
    <div className="forms-field">
      <label>Package Amount</label>
      <input
        className={errors.packageAmount ? "input-error" : ""}
        type="number"
        name="packageAmount"
        value={formData.packageAmount}
        onChange={handleChange}
        onWheel={preventNumberScroll}
        placeholder="Enter total package amount"
        min="0"
      />

      {errors.packageAmount && (
        <small className="field-error">{errors.packageAmount}</small>
      )}
    </div>

    <div className="forms-field">
      <label>Balance Amount</label>
      <input
        type="text"
        value={calculatedBalance ? `₹${calculatedBalance}` : ""}
        readOnly
      />
    </div>

    <div className="forms-field">
      <label>Payment Status</label>
      <input type="text" value={currentPaymentStatus} readOnly />
    </div>
  </>
)}

                <div className="forms-field">
                  <label>Service Category</label>
                  <select
  className={errors.serviceCategory ? "input-error" : ""}
  name="serviceCategory"
  value={formData.serviceCategory}
  onChange={handleChange}
>
  <option value="">Select service category</option>
  <option value="googleServices">Google Services</option>
  <option value="otherServices">Other Services</option>
</select>

{errors.serviceCategory && (
  <small className="field-error">
    {errors.serviceCategory}
  </small>
)}
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
  className={errors.pincode ? "input-error" : ""}
  type="text"
  name="pincode"
  value={formData.pincode}
  onChange={handleChange}
  placeholder="Enter pincode"
/>

{errors.pincode && (
  <small className="field-error">
    {errors.pincode}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>City</label>
                  <input
  className={errors.city ? "input-error" : ""}
  type="text"
  name="city"
  value={formData.city}
  onChange={handleChange}
  placeholder="Enter city"
/>

{errors.city && (
  <small className="field-error">
    {errors.city}
  </small>
)}
                </div>

                <div className="forms-field">
                <label>Area</label>
                <input
  className={errors.area ? "input-error" : ""}
  type="text"
  name="area"
  value={formData.area}
  onChange={handleChange}
  placeholder="Enter area"
/>

{errors.area && (
  <small className="field-error">
    {errors.area}
  </small>
)}
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
  className={errors.businessName ? "input-error" : ""}
  type="text"
  name="businessName"
  value={formData.businessName}
  onChange={handleChange}
  placeholder="Enter business name"
  data-gramm="false"
  data-gramm_editor="false"
  data-enable-grammarly="false"
/>

{errors.businessName && (
  <small className="field-error">
    {errors.businessName}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>Mobile Number</label>
                  <input
  className={errors.mobileNumber ? "input-error" : ""}
  type="text"
  name="mobileNumber"
  value={formData.mobileNumber}
  onChange={handleChange}
  placeholder="Enter mobile number"
/>

{errors.mobileNumber && (
  <small className="field-error">
    {errors.mobileNumber}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>Full Name</label>
                  <input
  className={errors.fullName ? "input-error" : ""}
  type="text"
  name="fullName"
  value={formData.fullName}
  onChange={handleChange}
  placeholder="Enter full name"
/>

{errors.fullName && (
  <small className="field-error">
    {errors.fullName}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>GST Number</label>
                  <input
  className={errors.gstNumber ? "input-error" : ""}
  type="text"
  name="gstNumber"
  value={formData.gstNumber}
  onChange={handleChange}
  placeholder="Enter GST number"
/>

{errors.gstNumber && (
  <small className="field-error">
    {errors.gstNumber}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>GST Invoice Name</label>
                  <input
  className={errors.gstInvoiceName ? "input-error" : ""}
  type="text"
  name="gstInvoiceName"
  value={formData.gstInvoiceName}
  onChange={handleChange}
  placeholder="Enter GST invoice name"
/>

{errors.gstInvoiceName && (
  <small className="field-error">
    {errors.gstInvoiceName}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>Type of Business</label>
                  <select
  className={errors.typeOfBusiness ? "input-error" : ""}
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

{errors.typeOfBusiness && (
  <small className="field-error">
    {errors.typeOfBusiness}
  </small>
)}
                </div>

                {formData.typeOfBusiness === "Other" && (
                  <div className="forms-field">
                    <label>Other Business Type</label>
                    <input
  className={errors.typeOfBusinessOther ? "input-error" : ""}
  type="text"
  name="typeOfBusinessOther"
  value={formData.typeOfBusinessOther}
  onChange={handleChange}
  placeholder="Enter other business type"
/>

{errors.typeOfBusinessOther && (
  <small className="field-error">
    {errors.typeOfBusinessOther}
  </small>
)}
                  </div>
                )}

                <div className="forms-field full-width">
                  <label>Address</label>
                  <textarea
  className={`forms-textarea ${
    errors.address ? "input-error" : ""
  }`}
  name="address"
  value={formData.address}
  onChange={handleChange}
  placeholder="Enter address"
/>

{errors.address && (
  <small className="field-error">
    {errors.address}
  </small>
)}
                </div>

                <div className="forms-field full-width">
                  <label>Google Map Link</label>
                  <input
  className={errors.googleMapLink ? "input-error" : ""}
  type="text"
  name="googleMapLink"
  value={formData.googleMapLink}
  onChange={handleChange}
  placeholder="Enter Google Map link"
/>

{errors.googleMapLink && (
  <small className="field-error">
    {errors.googleMapLink}
  </small>
)}
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
  className={errors.transactionIdOrChequeNumber ? "input-error" : ""}
  type="text"
  name="transactionIdOrChequeNumber"
  value={formData.transactionIdOrChequeNumber}
  onChange={handleChange}
  placeholder="Enter transaction ID / cheque number"
/>

{errors.transactionIdOrChequeNumber && (
  <small className="field-error">
    {errors.transactionIdOrChequeNumber}
  </small>
)}
                </div>

                <div className="forms-field">
                  <label>Payment Details</label>
                  <select
  className={errors.paymentDetails ? "input-error" : ""}
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

{errors.paymentDetails && (
  <small className="field-error">
    {errors.paymentDetails}
  </small>
)}
                </div>

                {formData.paymentDetails === "Other" && (
                  <div className="forms-field full-width">
                    <label>Other Payment Details</label>
                    <input
  className={errors.paymentDetailsOther ? "input-error" : ""}
  type="text"
  name="paymentDetailsOther"
  value={formData.paymentDetailsOther}
  onChange={handleChange}
  placeholder="Enter other payment details"
/>

{errors.paymentDetailsOther && (
  <small className="field-error">
    {errors.paymentDetailsOther}
  </small>
)}
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
                    {errors.googleServices && (
  <small className="field-error">
    {errors.googleServices}
  </small>
)}

                    {formData.googleServices.includes("Others") && (
                      <div className="forms-field service-other-field">
                        <label>Other Google Service</label>
                        <textarea
  className={`forms-textarea ${
    errors.googleServicesOther ? "input-error" : ""
  }`}
  name="googleServicesOther"
  value={formData.googleServicesOther}
  onChange={handleChange}
  placeholder="Enter other Google service"
/>

{errors.googleServicesOther && (
  <small className="field-error">
    {errors.googleServicesOther}
  </small>
)}
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
                    {errors.otherServices && (
  <small className="field-error">
    {errors.otherServices}
  </small>
)}

                    {formData.otherServices.includes("Other Services") && (
                      <div className="forms-field service-other-field">
                        <label>Other Service Details</label>
                        <textarea
  className={`forms-textarea ${
    errors.otherServicesOther ? "input-error" : ""
  }`}
  name="otherServicesOther"
  value={formData.otherServicesOther}
  onChange={handleChange}
  placeholder="Enter other service details"
/>

{errors.otherServicesOther && (
  <small className="field-error">
    {errors.otherServicesOther}
  </small>
)}
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
    <span>Package Amount</span>
    <strong>
      {formData.paymentType === "complete"
        ? formData.revenue
          ? `₹${Number(formData.revenue).toFixed(2)}`
          : "-"
        : formData.packageAmount
        ? `₹${Number(formData.packageAmount).toFixed(2)}`
        : "-"}
    </strong>
  </div>

  <div className="forms-summary-row">
    <span>Balance Amount</span>
    <strong>
      {calculatedBalance !== "" ? `₹${calculatedBalance}` : "-"}
    </strong>
  </div>

  <div className="forms-summary-row">
    <span>Payment Status</span>
    <strong>{currentPaymentStatus}</strong>
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
                    <th>Package Amount</th>
                    <th>Balance</th>
                    <th>Payment Status</th>
                    <th>Payment Type</th>
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
                      <td>{Number(item.packageAmount || item.revenue || 0).toFixed(2)}</td>
                      <td>{Number(item.balanceAmount || 0).toFixed(2)}</td>
                      <td>{item.paymentStatus || "Paid"}</td>
                      <td>
                          {item.paymentType === "partial"
                            ? "Partial"
                            : item.paymentType === "additional"
                            ? "Additional"
                            : "Complete"}
                      </td>
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
                      <td className="forms-payment-history-cell">
                          {formatPaymentTransactions(item)}
                      </td>
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
                        <div className="forms-action-group">
                        <button className="btn btn-primary btn-sm" onClick={() => handleEdit(item)}>
                          Edit
                        </button>

                          {Number(item.balanceAmount || 0) > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleAddPayment(item)}>
                          Add Payment
                        </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
  <tr>
    <th colSpan="2" className="forms-total-title">
      Monthly Total
    </th>

    <th className="forms-total-cell">
      <span>Total Revenue</span>
      <strong>₹{totals.revenue.toFixed(2)}</strong>
    </th>

    <th className="forms-total-cell">
      <span>Total Ex GST</span>
      <strong>₹{totals.exGst.toFixed(2)}</strong>
    </th>

    <th className="forms-total-cell">
      <span>Total Profit Sharing</span>
      <strong>₹{totals.profitSharing.toFixed(2)}</strong>
    </th>

    <th colSpan="19"></th>
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
      {successPopupMode === "success" && (
        <>
          <div className="confetti">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index}></span>
            ))}
          </div>

          <h2>🎉 Congratulations!</h2>
          <p>Form submitted successfully</p>
        </>
      )}

      {successPopupMode === "saving" && (
        <>
          <h2>Saving...</h2>
          <p>Please wait while we save the form.</p>
        </>
      )}

      {successPopupMode === "pending" && (
        <>
          <h2>⏳ Approval Pending</h2>
          <p>
            This Transaction ID / Cheque Number is already used. Your form has
            been sent to admin for approval.
          </p>
          <p>
            Please contact admin. Once admin approves, the form will be saved.
          </p>
        </>
      )}

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