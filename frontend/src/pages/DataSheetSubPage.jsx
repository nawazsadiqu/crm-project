import { Link, useParams } from "react-router-dom";

const DataSheetSubPage = () => {
  const { pageId } = useParams();

  return (
    <div className="page-center">
      <div className="form-card long">
        <h1>Data Sheet - {pageId?.replace("-", " ")}</h1>
        <p>
          This page is ready. Now you can tell me what fields you want inside
          this section.
        </p>

        <Link to="/ba/data-sheet" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
  );
};

export default DataSheetSubPage;