import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/baCallingData.css";

const BaCallingDataPage = () => {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/calling-data/my");

      setData(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch calling data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (item) => {
    navigate("/ba/tmc", {
      state: { callingData: item }
    });
  };

  const getMapLink = (link) => {
    if (!link) return "";
    return link.startsWith("http") ? link : `https://${link}`;
  };

  return (
    <div className="ba-calling-page">
      <div className="ba-calling-card">
        <div className="ba-calling-header">
          <div>
            <h2>Calling Data</h2>
            <p>Assigned business leads for calling</p>
          </div>
        </div>

        {message && <p className="ba-calling-message">{message}</p>}

        {loading ? (
          <p className="ba-calling-loading">Loading...</p>
        ) : data.length === 0 ? (
          <p className="ba-calling-empty">No calling data available</p>
        ) : (
          <div className="ba-calling-table-wrap">
            <table className="ba-calling-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  <th>Response 1</th>
                  <th>Response 2</th>
                  <th>Response 3</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => handleRowClick(item)}
                    className="clickable-row"
                  >
                    <td>{item.businessName}</td>

                    <td>
                      {item.mapLink ? (
                        <a
                          href={getMapLink(item.mapLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="map-link"
                        >
                          Open Map
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{item.contactNumber || "-"}</td>
                    <td>{item.response1 || "-"}</td>
                    <td>{item.response2 || "-"}</td>
                    <td>{item.response3 || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaCallingDataPage;