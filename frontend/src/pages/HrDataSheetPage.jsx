import { Link } from "react-router-dom";
import "../css/dataSheetMenu.css";

const HrDataSheetPage = () => {
  const menuItems = [
    {
      title: "Call Summary",
      description:
        "View HR daily, weekly, and monthly calling summary.",
      path: "/hr/call-summary",
    },
    {
      title: "Interested Candidates",
      description:
        "View candidates marked as interested by HR.",
      path:
        "/hr/data-sheet/interested-candidates",
    },
    {
      title: "Call Back Candidates",
      description:
        "Track candidates marked as call back, not lifting, or not connected.",
      path:
        "/hr/data-sheet/callback-candidates",
    },
    {
      title: "Resume Got",
      description:
        "View candidates whose resume has been received.",
      path:
        "/hr/data-sheet/resume-got",
    },
    {
      title: "Scheduled Interviews",
      description:
        "View candidates whose interview date is scheduled.",
      path:
        "/hr/data-sheet/scheduled-interviews",
    },
    {
      title: "First Round Candidates",
      description:
        "View candidates who attended the first round of interview.",
      path:
        "/hr/data-sheet/first-round-candidates",
    },
    {
      title: "Second Round Candidates",
      description:
        "View candidates selected for the second round of interview.",
      path:
        "/hr/data-sheet/second-round-candidates",
    },
    {
      title: "Joined Candidates",
      description:
        "View candidates marked as joined after the second round.",
      path:
        "/hr/data-sheet/joined-candidates",
    },
  ];

  return (
    <div className="data-sheet-page">
      <div className="data-sheet-card">
        <div className="data-sheet-header">
          <div>
            <h2 className="data-sheet-title">
              HR Data Sheet
            </h2>

            <p className="data-sheet-subtitle">
              Access HR candidate data
              sections from one place
            </p>
          </div>

          <Link
            to="/hr"
            className="btn btn-secondary"
          >
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

export default HrDataSheetPage;