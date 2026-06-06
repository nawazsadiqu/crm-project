import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const BaUpdatePage = () => {
  const [data, setData] = useState([]);
  const [gmbQueries, setGmbQueries] = useState([]);
  const [showGmbQueries, setShowGmbQueries] = useState(false);
  const [queryUnreadCount, setQueryUnreadCount] = useState(0);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get("/ba-updates");

      setData(res.data.businesses || []);
      setGmbQueries(res.data.gmbQueries || []);

      const unreadRes = await api.get("/crm/gmb-queries/unread-count");
      setQueryUnreadCount(unreadRes.data.count || 0);
    } catch (err) {
      console.error(err);
      setData([]);
      setGmbQueries([]);
      setQueryUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchData();

    const markRead = async () => {
      try {
        await api.put("/ba-updates/mark-read");
      } catch (error) {
        console.error(error);
      }
    };

    markRead();
  }, []);

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

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
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

        <button
  className="btn btn-primary"
  onClick={async () => {
    setShowGmbQueries((prev) => !prev);

    try {
      await api.put("/crm/gmb-queries/mark-read");
      setQueryUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  }}
  style={{
    position: "relative"
  }}
>
  GMB Queries {gmbQueries.length > 0 ? `(${gmbQueries.length})` : ""}

  {queryUnreadCount > 0 && (
    <span
      style={{
        position: "absolute",
        top: "-8px",
        right: "-8px",
        background: "#dc2626",
        color: "#fff",
        borderRadius: "50%",
        minWidth: "20px",
        height: "20px",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold"
      }}
    >
      {queryUnreadCount}
    </span>
  )}
</button>
      </div>

      {showGmbQueries && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
            background: "#f8fafc"
          }}
        >
          <h3>GMB Queries</h3>

          {gmbQueries.length === 0 ? (
            <p>No GMB queries found.</p>
          ) : (
            gmbQueries.map((query) => (
              <div
                key={query._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "12px",
                  background: "#ffffff"
                }}
              >
                <p>
                  <b>Date:</b> {query.date || "-"}
                </p>

                <p>
                  <b>Business:</b> {query.businessName || "-"}
                </p>

                <p>
                  <b>BA Name:</b> {query.baName || "-"}
                </p>

                <p>
                  <b>Comment:</b> {query.comment || "-"}
                </p>

                <p>
                  <b>Contact:</b> {query.contactNumber || "-"}
                </p>

                <p>
                  <b>Map:</b>{" "}
                  {query.mapLink ? (
                    <a
                      href={query.mapLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Map
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      )}

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
            <p>
              <b>Services:</b> {item.services.join(", ")}
            </p>

            {item.updates.photoshoot && (
              <div>
                <p>
                  <b>Photoshoot:</b>
                </p>
                <p> Shoot: {item.updates.photoshoot.status}</p>
                <p> Upload: {item.updates.photoshoot.uploadStatus}</p>
              </div>
            )}

            {item.updates.optimization && (
              <div>
                <p>
                  <b>Optimization:</b>{" "}
                  {item.updates.optimization.comment || "-"}
                </p>

                <p>
                  <b>Optimization Status:</b>{" "}
                  {item.updates.optimization.weeklyUpdateStatus || "Pending"}
                </p>
              </div>
            )}

            {item.updates.contactNumber && (
              <div>
                <p>
                  <b>Contact Update:</b>{" "}
                  {item.updates.contactNumber.comment || "-"}
                </p>

                <p>
                  <b>Contact Status:</b>{" "}
                  {item.updates.contactNumber.escalationStatus ||
                    "not escalated"}
                </p>
              </div>
            )}

            {item.updates.gmbProfile && (
              <p>
                <b>GMB Update:</b> {item.updates.gmbProfile}
              </p>
            )}

            {item.updates.pageHandling && (
              <p>
                <b>Page Handling:</b> {item.updates.pageHandling}
              </p>
            )}

            {item.updates.suspendedPage && (
              <div>
                <p>
                  <b>Suspended Page:</b>{" "}
                  {item.updates.suspendedPage.comment || "-"}
                </p>

                <p>
                  <b>Suspended Status:</b>{" "}
                  {item.updates.suspendedPage.escalationStatus ||
                    "not escalated"}
                </p>
              </div>
            )}

            {item.updates.otherServices && (
              <p>
                <b>Other Services:</b> {item.updates.otherServices}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default BaUpdatePage;