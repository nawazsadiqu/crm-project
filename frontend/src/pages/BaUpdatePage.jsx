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

 const normalizeText = (value) => {
  return String(value || "").trim().toLowerCase();
};

const hasPendingText = (value) => {
  const text = normalizeText(value);

  if (!text) return true;

  return (
    text.includes("pending") ||
    text.includes("not live") ||
    text.includes("not done") ||
    text.includes("not completed") ||
    text.includes("not complete") ||
    text.includes("not uploaded") ||
    text.includes("not updated") ||
    text.includes("not started") ||
    text.includes("rejected") ||
    text.includes("failed") ||
    text.includes("issue") ||
    text.includes("problem") ||
    text.includes("hold") ||
    text.includes("waiting")
  );
};

const isDoneText = (value) => {
  const text = normalizeText(value);

  if (!text) return false;

  if (hasPendingText(text)) return false;

  return (
    text.includes("done") ||
    text.includes("completed") ||
    text.includes("complete") ||
    text.includes("uploaded") ||
    text.includes("updated") ||
    text.includes("live") ||
    text.includes("approved") ||
    text.includes("fixed")
  );
};

const isOptimizationDoneText = (value) => {
  const text = normalizeText(value);

  if (!text) return false;

  if (hasPendingText(text)) return false;

  return (
    text.includes("started") ||
    text.includes("done") ||
    text.includes("completed") ||
    text.includes("complete") ||
    text.includes("live") ||
    text.includes("updated")
  );
};

const isPhotoshootDone = (item) => {
  const photoshoot = item.updates?.photoshoot;

  if (!photoshoot) return false;

  return (
    isDoneText(photoshoot.status) &&
    isDoneText(photoshoot.uploadStatus)
  );
};

const isOptimizationDone = (item) => {
  const optimization = item.updates?.optimization;

  if (!optimization) return false;

  return (
    isOptimizationDoneText(optimization.weeklyUpdateStatus) ||
    isOptimizationDoneText(optimization.comment)
  );
};

const isContactNumberDone = (item) => {
  const contactNumber = item.updates?.contactNumber;

  if (!contactNumber) return false;

  return (
    isDoneText(contactNumber.escalationStatus) ||
    isDoneText(contactNumber.comment)
  );
};

const isSimpleServiceDone = (serviceUpdate) => {
  if (!serviceUpdate) return false;

  return (
    isDoneText(serviceUpdate.comment) ||
    isDoneText(serviceUpdate.status) ||
    isDoneText(serviceUpdate.escalationStatus) ||
    isDoneText(serviceUpdate.weeklyUpdateStatus)
  );
};

const isPageHandlingDone = (item) => {
  const pageHandling = item.updates?.pageHandling;

  if (!pageHandling) return false;

  const text = normalizeText(pageHandling.comment);

  if (!text) return false;

  if (hasPendingText(text)) return false;

  return (
    text.includes("started") ||
    text.includes("done") ||
    text.includes("completed") ||
    text.includes("complete") ||
    text.includes("uploaded") ||
    text.includes("updated") ||
    text.includes("live")
  );
};

const isServiceCompleted = (item, serviceName) => {
  const service = normalizeText(serviceName);

  if (service.includes("photoshoot") || service.includes("photo")) {
    return isPhotoshootDone(item);
  }

  if (service.includes("optimization") || service.includes("optimisation")) {
    return isOptimizationDone(item);
  }

  if (service.includes("contact")) {
    return isContactNumberDone(item);
  }

  if (service.includes("gmb")) {
    return isSimpleServiceDone(item.updates?.gmbProfile);
  }

  if (service.includes("page handling")) {
    return isPageHandlingDone(item);
  }

  if (service.includes("suspended")) {
    return isSimpleServiceDone(item.updates?.suspendedPage);
  }

  if (service.includes("other")) {
    return isSimpleServiceDone(item.updates?.otherServices);
  }

  return false;
};

const isAllServicesCompleted = (item) => {
  const services = Array.isArray(item.services) ? item.services : [];

  if (services.length === 0) return false;

  return services.every((service) => isServiceCompleted(item, service));
};

const completedBusinessesCount = filteredData.filter((item) =>
  isAllServicesCompleted(item)
).length;

const totalBusinessesCount = filteredData.length;

const pendingBusinessesCount = totalBusinessesCount - completedBusinessesCount;

  return (
    <div style={{ padding: "20px" }}>
  <h2>Updates</h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
      margin: "16px 0 20px"
    }}
  >
    <div
      style={{
        background: "#ecfdf5",
        border: "1px solid #86efac",
        borderRadius: "14px",
        padding: "14px"
      }}
    >
      <p style={{ margin: 0, color: "#166534", fontWeight: "700" }}>
        Completed Businesses
      </p>
      <h3 style={{ margin: "8px 0 0", color: "#14532d", fontSize: "28px" }}>
        {completedBusinessesCount}
      </h3>
    </div>

    <div
      style={{
        background: "#fff7ed",
        border: "1px solid #fdba74",
        borderRadius: "14px",
        padding: "14px"
      }}
    >
      <p style={{ margin: 0, color: "#9a3412", fontWeight: "700" }}>
        Pending Businesses
      </p>
      <h3 style={{ margin: "8px 0 0", color: "#7c2d12", fontSize: "28px" }}>
        {pendingBusinessesCount}
      </h3>
    </div>

    <div
      style={{
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        borderRadius: "14px",
        padding: "14px"
      }}
    >
      <p style={{ margin: 0, color: "#1d4ed8", fontWeight: "700" }}>
        Total Businesses
      </p>
      <h3 style={{ margin: "8px 0 0", color: "#0b2559", fontSize: "28px" }}>
        {totalBusinessesCount}
      </h3>
    </div>
  </div>

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
        filteredData.map((item) => {
  const allServicesCompleted = isAllServicesCompleted(item);

  return (
    <div
      key={item._id}
      style={{
        position: "relative",
        border: allServicesCompleted
          ? "2px solid #16a34a"
          : item.isNewUpdate
          ? "2px solid #dc2626"
          : "1px solid #fecaca",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "16px",
        background: allServicesCompleted
          ? "linear-gradient(135deg, #ecfdf5 0%, #ffffff 75%)"
          : "linear-gradient(135deg, #fff7f7 0%, #ffffff 75%)",
        boxShadow: allServicesCompleted
          ? "0 10px 24px rgba(22, 163, 74, 0.12)"
          : "0 10px 24px rgba(220, 38, 38, 0.06)"
      }}
    >

      {allServicesCompleted && (
  <span
    style={{
      position: "absolute",
      top: "12px",
      right: "12px",
      background: "#16a34a",
      color: "#fff",
      padding: "5px 11px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "800"
    }}
  >
    ✓ Completed
  </span>
)}
  {item.isNewUpdate && !allServicesCompleted && (
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
  );
})
      )}
    </div>
  );
};

export default BaUpdatePage;