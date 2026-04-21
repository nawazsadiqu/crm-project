import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/digitalWorkPlanner.css";

const formatOtherServices = (services, otherText) => {
  if (!Array.isArray(services) || services.length === 0) return "";

  return services
    .map((service) => {
      if (service === "Other Services") {
        return otherText?.trim() || "Other Services";
      }
      return service;
    })
    .join(", ");
};

const DigitalMarketingWorkPlannerPage = () => {
  const [businessOptions, setBusinessOptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    formId: "",
    businessName: "",
    selectedServices: [],
    posterImagesRequired: "",
    reelsRequired: "",
    posterImagesDone: "",
    reelsDone: "",
    googleAdsCampaignStatus: "",
    googleAdsPriceDetails: "",
    metaAdsCampaignStatus: "",
    metaAdsPriceDetails: "",
    otherServiceDetails: "",
    otherServiceRequired: "",
    otherServiceDone: ""
  });

  useEffect(() => {
    fetchBusinessOptions();
    fetchPlans();
  }, []);

  const fetchBusinessOptions = async () => {
    const { data } = await api.get("/digital-marketing/business-options");
    setBusinessOptions(data || []);
  };

  const fetchPlans = async () => {
    const { data } = await api.get("/digital-marketing/plans");
    setPlans(data || []);
  };

  const handleBusinessChange = (e) => {
    const selected = businessOptions.find((b) => b._id === e.target.value);

    setFormData({
      formId: selected?._id || "",
      businessName: selected?.businessName || "",
      selectedServices: selected?.otherServices || [],
      otherServiceDetails: selected?.otherServicesOther || ""
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    await api.post("/digital-marketing/plans", formData);
    setMessage("Saved successfully");
    fetchPlans();
  };

  const hasSmm = formData.selectedServices.includes("Social Media Marketing");
  const hasGoogleAds = formData.selectedServices.includes("Google Ads");
  const hasMetaAds = formData.selectedServices.includes("Meta Ads");
  const hasOther = formData.selectedServices.includes("Other Services");

  return (
    <div className="dm-page">
      <div className="dm-card">

        {/* HEADER */}
        <div className="dm-header">
          <div>
            <h2>Work Planner</h2>
            <p>Manage posters, reels & ad campaigns</p>
          </div>

          <button className="btn btn-secondary" onClick={fetchPlans}>
            Refresh
          </button>
        </div>

        {message && <p className="dm-message">{message}</p>}

        {/* FORM */}
        <div className="dm-form">

          <div className="dm-field full">
            <label>Select Business</label>
            <select value={formData.formId} onChange={handleBusinessChange}>
              <option value="">Select business</option>
              {businessOptions.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.businessName}
                </option>
              ))}
            </select>
          </div>

          {formData.selectedServices.length > 0 && (
            <div className="dm-field full">
              <label>Selected Services</label>
              <input
                value={formatOtherServices(
                  formData.selectedServices,
                  formData.otherServiceDetails
                )}
                readOnly
              />
            </div>
          )}

        </div>

        {/* SMM */}
        {hasSmm && (
          <div className="dm-section">
            <h3>Social Media Marketing</h3>

            <div className="dm-grid">
              <input name="posterImagesRequired" placeholder="Poster Required" onChange={handleChange} />
              <input name="reelsRequired" placeholder="Reels Required" onChange={handleChange} />
              <input name="posterImagesDone" placeholder="Poster Done" onChange={handleChange} />
              <input name="reelsDone" placeholder="Reels Done" onChange={handleChange} />
            </div>
          </div>
        )}

        {/* GOOGLE ADS */}
        {hasGoogleAds && (
          <div className="dm-section">
            <h3>Google Ads</h3>

            <div className="dm-radio">
              <label><input type="radio" name="googleAdsCampaignStatus" value="Active" onChange={handleChange}/> Active</label>
              <label><input type="radio" name="googleAdsCampaignStatus" value="Inactive" onChange={handleChange}/> Inactive</label>
            </div>

            <input
              name="googleAdsPriceDetails"
              placeholder="Price details"
              onChange={handleChange}
            />
          </div>
        )}

        {/* META ADS */}
        {hasMetaAds && (
          <div className="dm-section">
            <h3>Meta Ads</h3>

            <div className="dm-radio">
              <label><input type="radio" name="metaAdsCampaignStatus" value="Active" onChange={handleChange}/> Active</label>
              <label><input type="radio" name="metaAdsCampaignStatus" value="Inactive" onChange={handleChange}/> Inactive</label>
            </div>

            <input
              name="metaAdsPriceDetails"
              placeholder="Price details"
              onChange={handleChange}
            />
          </div>
        )}

        {/* OTHER */}
        {hasOther && (
          <div className="dm-section">
            <h3>Other Services</h3>

            <textarea name="otherServiceRequired" placeholder="Required" onChange={handleChange}/>
            <textarea name="otherServiceDone" placeholder="Done" onChange={handleChange}/>
          </div>
        )}

        <div className="dm-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Plan
          </button>
        </div>

        {/* TABLE */}
        <div className="dm-table-section">
          <h3>Saved Plans</h3>

          <div className="dm-table-wrapper">
            <table className="dm-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Services</th>
                  <th>Posters</th>
                  <th>Reels</th>
                  <th>Google Ads</th>
                  <th>Meta Ads</th>
                </tr>
              </thead>

              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td>{p.businessName}</td>
                    <td>{p.selectedServices?.join(", ")}</td>
                    <td>{p.posterImagesDone}/{p.posterImagesRequired}</td>
                    <td>{p.reelsDone}/{p.reelsRequired}</td>
                    <td>{p.googleAdsCampaignStatus}</td>
                    <td>{p.metaAdsCampaignStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DigitalMarketingWorkPlannerPage;