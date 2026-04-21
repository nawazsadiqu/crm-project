import { Link } from "react-router-dom";

const FrontendPage = () => {
  return (
    <>
      <section className="frontend-command-center">
        <div className="frontend-command-left">
          <h2>Command Center</h2>
          <p>Quick access to your frontend work sections</p>
        </div>
      </section>

      <section className="frontend-cards-grid">

        <Link to="/ba/goals" className="frontend-card">
          <h3>Goals & Results</h3>
          <p>Track daily targets and performance</p>
        </Link>

        <Link to="/ba/tmc" className="frontend-card">
          <h3>TMC</h3>
          <p>Manage calls, status updates and workflow</p>
        </Link>

        <Link to="/ba/data-sheet" className="frontend-card">
          <h3>Data Sheet</h3>
          <p>Check final data and summary details</p>
        </Link>

        <Link to="/ba/updates" className="frontend-card">
          <h3>Updates</h3>
          <p>Track CRM updates for your businesses</p>
        </Link>
      </section>
    </>
  );
};

export default FrontendPage;