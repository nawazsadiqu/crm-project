import { Link } from "react-router-dom";
import "../css/dataSheetMenu.css";

const DataSheetMenuPage = () => {
  const menuItems = [
    {
      title: "Main Data",
      description: "View the main daily summary and key tracking data.",
      path: "/ba/data-sheet/main-data"
    },
    {
      title: "Call Details",
      description: "Check call information and daily call-related records.",
      path: "/ba/data-sheet/call-details"
    },
    {
      title: "Presentation Details",
      description: "Track presentation entries and related updates.",
      path: "/ba/data-sheet/presentation-details"
    },

    // 👇 Updated section (appointments flow)

    {
      title: "Appointments",
      description: "View appointment fixed records.",
      path: "/ba/appointments"
    },
    {
      title: "Callback Appointments",
      description: "Track CBC and CBA follow-ups.",
      path: "/ba/callback-appointments"
    },
    {
      title: "Rejected Appointments",
      description: "View rejected presentation outcomes.",
      path: "/ba/rejected-appointments"
    },
    {
      title: "Visited Appointments",
      description: "See completed or visited appointments.",
      path: "/ba/visited-appointments"
    },

    // 👇 existing
    {
      title: "Forms",
      description: "Manage submitted forms and related entries.",
      path: "/ba/forms"
    }
  ];

  return (
    <div className="data-sheet-page">
      <div className="data-sheet-card">
        <div className="data-sheet-header">
          <div>
            <h2 className="data-sheet-title">Data Sheet</h2>
            <p className="data-sheet-subtitle">
              Access all data sections from one place
            </p>
          </div>

          <Link to="/ba" className="btn btn-secondary">
            Back
          </Link>
        </div>

        <div className="data-sheet-grid">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="data-sheet-option-card"
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataSheetMenuPage;