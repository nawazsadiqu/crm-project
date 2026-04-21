import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div className="page-center">
      <div className="form-card">
        <h1>Unauthorized</h1>
        <p>You do not have access to this page.</p>
        <Link to="/" className="btn btn-secondary">
          Go Back
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;