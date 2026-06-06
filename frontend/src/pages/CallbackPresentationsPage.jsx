import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const CallbackPresentationsPage = () => {
  const [records, setRecords] = useState([]);
  const navigate = useNavigate();

  const getValue = (notes, label) => {
    const line = notes
      ?.split("\n")
      .find((row) => row.toLowerCase().startsWith(label.toLowerCase()));

    return line ? line.split(":").slice(1).join(":").trim() : "";
  };

  const handleDelete = async (item) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this record?"
  );

  if (!confirmDelete) return;

  await api.delete(
    `/tmc/callback-presentations/${item.logId}/${item.callNumber}`
  );

  fetchRecords();
};

  const fetchRecords = async () => {
    const { data } = await api.get("/tmc/callback-presentations");
    setRecords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleGoToTmc = ({ businessName, mapLink, contactNumber }) => {
  navigate("/ba/tmc", {
    state: {
      callbackPresentation: {
        businessName,
        mapLink,
        contactNumber
      },
      returnTo: "/ba/data-sheet/callback-presentations"
    }
  });
};

  return (
    <div className="appointments-page">
      <div className="appointments-card">
        <h2>Call Back for Presentation</h2>

        <table className="appointments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Call No</th>
              <th>Business Name</th>
              <th>Map Link</th>
              <th>Contact Number</th>
              <th>Manual Notes</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {records.map((item) => {
              const businessName = getValue(item.notes, "Business Name");
              const mapLink = getValue(item.notes, "Map Link");
              const contactNumber = getValue(item.notes, "Contact Number");
              const manualNote = item.notes?.includes("Manual Note:")
                ? item.notes.split("Manual Note:").pop().trim()
                : "";

              return (
                <tr key={item._id}>
                  <td>{item.date}</td>
                  <td>{item.callNumber}</td>
                  <td>
  <button
    type="button"
    onClick={() =>
      handleGoToTmc({
        businessName,
        mapLink,
        contactNumber
      })
    }
    style={{
      background: "none",
      border: "none",
      color: "#000000",
      cursor: "pointer",
      fontWeight: "700",
      textDecoration: "none"
    }}
  >
    {businessName || "-"}
  </button>
</td>
                  <td>
                    {mapLink ? (
                      <a href={mapLink} target="_blank" rel="noreferrer">
                        Open Map
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{contactNumber || "-"}</td>
                  <td>{manualNote || "-"}</td>
                  <td>
                    <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(item)}
                    >
                    Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Link to="/ba/data-sheet" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
  );
};

export default CallbackPresentationsPage;