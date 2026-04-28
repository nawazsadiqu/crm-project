import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/baCallingData.css";

const BaCallingDataPage = () => {
  const [data, setData] = useState([]);
  const [contactNumbers, setContactNumbers] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/calling-data/my");
      const callingData = Array.isArray(data) ? data : [];

      setData(callingData);

      const numbers = {};
      callingData.forEach((item) => {
        numbers[item._id] = item.contactNumber || "";
      });

      setContactNumbers(numbers);
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

  const handleContactNumberChange = (id, value) => {
    setContactNumbers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleContactNumberSave = async (id) => {
    try {
      const newContactNumber = contactNumbers[id] || "";

      await api.put(`/calling-data/${id}/contact-number`, {
        contactNumber: newContactNumber,
      });

      setData((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, contactNumber: newContactNumber }
            : item
        )
      );

      setMessage("Contact number updated successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to update contact number"
      );
    }
  };

  const handleRowClick = (item) => {
    navigate("/ba/tmc", {
      state: { callingData: item },
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
                  <th>Sl No</th>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  <th>Response 1</th>
                  <th>Response 2</th>
                  <th>Response 3</th>
                  <th>Last Response</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={item._id}
                    onClick={() => handleRowClick(item)}
                    className="clickable-row"
                  >
                    <td>{item.serialNumber || index + 1}</td>

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

                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={contactNumbers[item._id] || ""}
                        onChange={(e) =>
                          handleContactNumberChange(item._id, e.target.value)
                        }
                        onBlur={() => handleContactNumberSave(item._id)}
                        className="contact-edit-input"
                        placeholder="Enter number"
                      />
                    </td>

                    <td>{item.response1 || "-"}</td>
                    <td>{item.response2 || "-"}</td>
                    <td>{item.response3 || "-"}</td>
                    <td>{item.lastResponse || "-"}</td>
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