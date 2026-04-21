import { Link } from "react-router-dom";
import "../css/frontend.css";

const CrmPage = () => {
  const cards = [
    {
      title: "GMB Profile",
      icon: "📍",
      description: "Manage GMB profile related service records.",
      path: "/crm/gmb-profile"
    },
    {   
      title: "Optimization",
      icon: "⚙️",
      description: "Manage businesses that selected optimization service.",
      path: "/crm/optimization"
    },
    {
      title: "Photoshoot",
      icon: "📸",
      description: "Track and manage photoshoot service status.",
      path: "/crm/photoshoot"
    },
    {
      title: "Contact Number",
      icon: "📞",
      description: "Handle contact number service records and updates.",
      path: "/crm/contact-number"
    },
    {
      title: "Suspended Page",
      icon: "⛔",
      description: "Manage suspended page cases and CRM remarks.",
      path: "/crm/suspended-page"
    },
    {
      title: "Page Handling",
      icon: "📄",
      description: "Track page handling services and CRM updates.",
      path: "/crm/page-handling"
    },
    {
      title: "Other Services",
      icon: "🧩",
      description: "Handle custom Google services selected as Others.",
      path: "/crm/google-other-services"
    }
  ];

  return (
    <div className="frontend-cards-grid">
      {cards.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className="frontend-card"
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{item.icon}</span>
            {item.title}
          </h3>
          <p>{item.description}</p>
        </Link>
      ))}
    </div>
  );
};

export default CrmPage;