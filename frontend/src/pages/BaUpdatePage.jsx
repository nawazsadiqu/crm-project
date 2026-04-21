import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const BaUpdatePage = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get("/ba-updates");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 FILTER LOGIC
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const lower = search.toLowerCase();

    return data.filter((item) =>
      [
        item.businessName,
        item.location,
        ...(item.services || [])
      ]
        .join(" ")
        .toLowerCase()
        .includes(lower)
    );
  }, [data, search]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Updates</h2>

      {/* 🔍 SEARCH BAR */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by business, location, service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "300px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      {filteredData.length === 0 ? (
        <p>No matching businesses found.</p>
      ) : (
        filteredData.map((item) => (
          <div
            key={item._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px"
            }}
          >
            <h3>{item.businessName}</h3>
            <p>{item.location}</p>
            <p><b>Services:</b> {item.services.join(", ")}</p>

            {/* PHOTOSHOOT */}
            {item.updates.photoshoot && (
              <div>
                <p><b>Photoshoot:</b></p>
                <p> Shoot: {item.updates.photoshoot.status}</p>
                <p> Upload: {item.updates.photoshoot.uploadStatus}</p>
              </div>
            )}

            {/* OTHER COMMENTS */}
            {item.updates.contactNumber && (
              <p><b>Contact Update:</b> {item.updates.contactNumber}</p>
            )}

            {item.updates.gmbProfile && (
              <p><b>GMB Update:</b> {item.updates.gmbProfile}</p>
            )}

            {item.updates.pageHandling && (
              <p><b>Page Handling:</b> {item.updates.pageHandling}</p>
            )}

            {item.updates.suspendedPage && (
              <p><b>Suspended Page:</b> {item.updates.suspendedPage}</p>
            )}

            {item.updates.otherServices && (
              <p><b>Other Services:</b> {item.updates.otherServices}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default BaUpdatePage;