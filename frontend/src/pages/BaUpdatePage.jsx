import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const BaUpdatePage = () => {
  const [data, setData] = useState([]);
  const [gmbQueries, setGmbQueries] = useState([]);
  const [showGmbQueries, setShowGmbQueries] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [showRecentUpdates, setShowRecentUpdates] = useState(false);
  const [queryUnreadCount, setQueryUnreadCount] = useState(0);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get("/ba-updates");

      setData(res.data.businesses || []);
      setGmbQueries(res.data.gmbQueries || []);
      setRecentUpdates(res.data.recentUpdates || []);

      const unreadRes = await api.get("/crm/gmb-queries/unread-count");
      setQueryUnreadCount(unreadRes.data.count || 0);
    } catch (err) {
      console.error(err);
      setData([]);
      setGmbQueries([]);
      setRecentUpdates([]);
      setQueryUnreadCount(0);
    }
  };

  useEffect(() => {
  const loadUpdates = async () => {
    await fetchData();

    try {
      await api.put("/ba-updates/mark-read");
    } catch (error) {
      console.error(error);
    }
  };

  loadUpdates();
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
<button
  className="btn btn-secondary"
  onClick={() => setShowRecentUpdates((prev) => !prev)}
>
  Recent Updates {recentUpdates.length > 0 ? `(${recentUpdates.length})` : ""}
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
      {showRecentUpdates && (
  <div
    style={{
      border: "1px solid #ddd",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "24px",
      background: "#f8fafc"
    }}
  >
    <h3>Recent Updates</h3>

    {recentUpdates.length === 0 ? (
      <p>No recent updates found.</p>
    ) : (
      recentUpdates.map((update) => (
        <div
          key={update._id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "12px",
            background: "#ffffff"
          }}
        >
          <p>
            <b>Business:</b> {update.businessName || "-"}
          </p>

          <p>
            <b>Service:</b> {update.serviceName || "-"}
          </p>

          <p>
            <b>Deal Closed Date:</b> {update.date || "-"}
          </p>

          <p>
            <b>Location:</b> {update.location || "-"}
          </p>

          <p>
            <b>Update:</b> {update.comment || "-"}
          </p>

          <p>
            <b>Updated Time:</b>{" "}
            {update.updatedAt
              ? new Date(update.updatedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })
              : "-"}
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
    position: "relative",
    border: item.isNewUpdate
      ? "2px solid #dc2626"
      : "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px"
  }}
>
  {item.isNewUpdate && (
    <span
      style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "#dc2626",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "700"
      }}
    >
      New Update
    </span>
  )}

  <h3>{item.businessName}</h3>

  <p>
    <b>Deal Closed Date:</b> {item.date || "-"}
  </p>

  <p>{item.location}</p>

  <p>
    <b>Services:</b> {(item.services || []).join(", ")}
  </p>

  {item.updates?.photoshoot && (
    <div>
      <p>
        <b>
          Photoshoot{" "}
          {item.updates.photoshoot.isNewUpdate && (
            <span style={{ color: "#dc2626", fontWeight: "700" }}>
              ● New
            </span>
          )}
          :
        </b>
      </p>
      <p> Shoot: {item.updates.photoshoot.status}</p>
      <p> Upload: {item.updates.photoshoot.uploadStatus}</p>
    </div>
  )}

  {item.updates?.optimization && (
    <div>
      <p>
        <b>
          Optimization{" "}
          {item.updates.optimization.isNewUpdate && (
            <span style={{ color: "#dc2626", fontWeight: "700" }}>
              ● New
            </span>
          )}
          :
        </b>{" "}
        {item.updates.optimization.comment || "-"}
      </p>

      <p>
        <b>Optimization Status:</b>{" "}
        {item.updates.optimization.weeklyUpdateStatus || "Pending"}
      </p>
    </div>
  )}

  {item.updates?.contactNumber && (
    <div>
      <p>
        <b>
          Contact Update{" "}
          {item.updates.contactNumber.isNewUpdate && (
            <span style={{ color: "#dc2626", fontWeight: "700" }}>
              ● New
            </span>
          )}
          :
        </b>{" "}
        {item.updates.contactNumber.comment || "-"}
      </p>

      <p>
        <b>Contact Status:</b>{" "}
        {item.updates.contactNumber.escalationStatus || "not escalated"}
      </p>
    </div>
  )}

  {item.updates?.gmbProfile && (
    <p>
      <b>
        GMB Update{" "}
        {item.updates.gmbProfile.isNewUpdate && (
          <span style={{ color: "#dc2626", fontWeight: "700" }}>
            ● New
          </span>
        )}
        :
      </b>{" "}
      {item.updates.gmbProfile.comment || "-"}
    </p>
  )}

  {item.updates?.pageHandling && (
    <p>
      <b>
        Page Handling{" "}
        {item.updates.pageHandling.isNewUpdate && (
          <span style={{ color: "#dc2626", fontWeight: "700" }}>
            ● New
          </span>
        )}
        :
      </b>{" "}
      {item.updates.pageHandling.comment || "-"}
    </p>
  )}

  {item.updates?.suspendedPage && (
    <div>
      <p>
        <b>
          Suspended Page{" "}
          {item.updates.suspendedPage.isNewUpdate && (
            <span style={{ color: "#dc2626", fontWeight: "700" }}>
              ● New
            </span>
          )}
          :
        </b>{" "}
        {item.updates.suspendedPage.comment || "-"}
      </p>

      <p>
        <b>Suspended Status:</b>{" "}
        {item.updates.suspendedPage.escalationStatus || "not escalated"}
      </p>
    </div>
  )}

  {item.updates?.otherServices && (
    <p>
      <b>
        Other Services{" "}
        {item.updates.otherServices.isNewUpdate && (
          <span style={{ color: "#dc2626", fontWeight: "700" }}>
            ● New
          </span>
        )}
        :
      </b>{" "}
      {item.updates.otherServices.comment || "-"}
    </p>
  )}
</div>
        ))
      )}
    </div>
  );
};

export default BaUpdatePage;