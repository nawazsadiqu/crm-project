import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/baCallingData.css";

const BaCallingDataPage = () => {
  const [data, setData] = useState([]);
  const [contactNumbers, setContactNumbers] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

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

  const handleIgnoredChange = async (id, checked) => {
  try {
    await api.put(`/calling-data/${id}/ignored`, {
      isIgnored: checked
    });

    setData((prev) =>
      prev
        .map((item) =>
          item._id === id ? { ...item, isIgnored: checked } : item
        )
        .sort((a, b) => {
          if (a.isIgnored === b.isIgnored) {
            return (a.serialNumber || 0) - (b.serialNumber || 0);
          }
          return a.isIgnored ? 1 : -1;
        })
    );
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Failed to update calling data"
    );
  }
};

const filteredData = data.filter((item) => {
  const search = searchTerm.toLowerCase();

  return (
    item.businessName?.toLowerCase().includes(search) ||
    item.contactNumber?.toLowerCase().includes(search) ||
    item.mapLink?.toLowerCase().includes(search) ||
    item.response1?.toLowerCase().includes(search) ||
    item.response2?.toLowerCase().includes(search) ||
    item.response3?.toLowerCase().includes(search) ||
    item.lastResponse?.toLowerCase().includes(search)
  );
});

  return (
    <div className="ba-calling-page">
      <div className="ba-calling-card">
        <div className="ba-calling-header">
          <div className="ba-calling-search">
  <input
    type="text"
    placeholder="Search by business name, number, map, response..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
          <div>
            <h2>Calling Data</h2>
            <p>Assigned business leads for calling</p>
          </div>
        </div>

        {message && <p className="ba-calling-message">{message}</p>}

        {loading ? (
          <p className="ba-calling-loading">Loading...</p>
        ) : filteredData.length === 0 ? (
          <p className="ba-calling-empty">No calling data available</p>
        ) : (
          <div className="ba-calling-table-wrap">
            <table className="ba-calling-table">
              <thead>
                <tr>
                  <th>No Need</th>
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
                {filteredData.map((item, index) => (
                  <tr
                    key={item._id}
                    onClick={() => handleRowClick(item)}
                    className="clickable-row"
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={item.isIgnored || false}
                        onChange={(e) => handleIgnoredChange(item._id, e.target.checked)}
                      />
                    </td>
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