import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../css/visitedAppointments.css";

const AppointmentVisitedPage = () => {
  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date().toISOString().slice(0, 7)
    );

  const [
    visitedAppointments,
    setVisitedAppointments
  ] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    visitedResponses,
    setVisitedResponses
  ] = useState({});

  const fetchVisitedAppointments =
    async () => {
      try {
        setLoading(true);

        const { data } = await api.get(
          `/presentation-details/visited-appointments?month=${selectedMonth}`
        );

        const records =
          Array.isArray(data)
            ? data
            : [];

        setVisitedAppointments(records);

        const responseObj = {};

        records.forEach((item) => {
          responseObj[item._id] =
            item.visitedResponse || "";
        });

        setVisitedResponses(
          responseObj
        );

        setMessage("");
      } catch (error) {
        console.error(
          "Failed to fetch visited appointments:",
          error
        );

        setVisitedAppointments([]);
        setVisitedResponses({});

        setMessage(
          error.response?.data
            ?.message ||
            "Failed to fetch visited appointments"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchVisitedAppointments();
  }, [selectedMonth]);

  const handleVisitedResponseChange = (
    id,
    value
  ) => {
    setVisitedResponses(
      (previous) => ({
        ...previous,
        [id]: value
      })
    );
  };

  const handleVisitedResponseSave =
    async (id) => {
      try {
        await api.put(
          `/presentation-details/visited-appointments/${id}/response`,
          {
            visitedResponse:
              visitedResponses[id] || ""
          }
        );

        setMessage(
          "Visited response updated successfully"
        );
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Failed to update visited response"
        );
      }
    };

  const handleNotInterested =
    async (item) => {
      const confirmUpdate =
        window.confirm(
          `Mark ${
            item.businessName ||
            "this business"
          } as Not Interested?`
        );

      if (!confirmUpdate) {
        return;
      }

      try {
        const { data } = await api.put(
          `/presentation-details/visited-appointments/${item._id}/not-interested`
        );

        setVisitedAppointments(
          (previous) =>
            previous.map(
              (appointment) =>
                appointment._id ===
                item._id
                  ? data.data
                  : appointment
            )
        );

        setMessage(
          "Visited appointment moved to Not Interested successfully"
        );
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Failed to mark visited appointment as Not Interested"
        );
      }
    };

  const matchesSearch = (item) => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    if (!search) {
      return true;
    }

    return [
      item.date,
      item.appointmentDate,
      item.visitedDate,
      item.businessName,
      item.mapLink,
      item.contact,
      visitedResponses[item._id],
      item.status,
      item.visitedRejectionReason
    ]
      .map((value) =>
        String(value || "")
          .toLowerCase()
      )
      .join(" ")
      .includes(search);
  };

  const monthlyVisitedAppointments =
    visitedAppointments
      .filter((item) => {
        const visitedDate =
          item.visitedDate || "";

        return visitedDate.startsWith(
          selectedMonth
        );
      })
      .sort((a, b) => {
        const aVisitedDate =
          a.visitedDate || "";

        const bVisitedDate =
          b.visitedDate || "";

        if (
          !aVisitedDate &&
          !bVisitedDate
        ) {
          return 0;
        }

        if (!aVisitedDate) {
          return 1;
        }

        if (!bVisitedDate) {
          return -1;
        }

        return bVisitedDate.localeCompare(
          aVisitedDate
        );
      });

  const activeVisitedAppointments =
    monthlyVisitedAppointments.filter(
      (item) =>
        !item.isVisitedNotInterested
    );

  const notInterestedAppointments =
    monthlyVisitedAppointments.filter(
      (item) =>
        item.isVisitedNotInterested
    );

  const filteredVisitedAppointments =
    activeVisitedAppointments.filter(
      matchesSearch
    );

  const filteredNotInterestedAppointments =
    notInterestedAppointments.filter(
      matchesSearch
    );

  return (
    <div className="visited-page">
      <div className="visited-card">
        <div className="visited-header">
          <div>
            <h2 className="visited-title">
              Visited Appointments
            </h2>

            <p className="visited-subtitle">
              Track completed appointments
              and verified visits
            </p>
          </div>
        </div>

        <div className="visited-top-bar">
          <div className="visited-filter-card">
            <label>Select Month</label>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value
                )
              }
            />
          </div>

          <div className="visited-filter-card appointments-search-card">
            <label>Search</label>

            <input
              type="text"
              placeholder="Search visited records..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="visited-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={
                fetchVisitedAppointments
              }
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {message && (
          <p className="visited-message">
            {message}
          </p>
        )}

        <div className="visited-summary-card">
          <div>
            <h3>Visited Records</h3>

            <p>
              Active visited appointments
              for the selected month
            </p>
          </div>

          <span className="visited-count-badge">
            {
              filteredVisitedAppointments.length
            }
          </span>
        </div>

        {loading ? (
          <p className="visited-loading">
            Loading visited appointments...
          </p>
        ) : filteredVisitedAppointments
            .length === 0 ? (
          <p className="visited-empty">
            No active visited appointments
            found for this month.
          </p>
        ) : (
          <div className="visited-table-wrapper">
            <table className="visited-table">
              <thead>
                <tr>
                  <th>Appointment Date</th>
                  <th>Visited Date</th>
                  <th>Business Name</th>
                  <th>Map Link</th>
                  <th>Contact</th>
                  <th>Visited Response</th>
                  <th>Appointment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredVisitedAppointments.map(
                  (item) => (
                    <tr key={item._id}>
                      <td>
                        {item.appointmentDate ||
                          item.date ||
                          "-"}
                      </td>

                      <td>
                        {item.visitedDate ||
                          "-"}
                      </td>

                      <td>
                        {item.businessName ||
                          "-"}
                      </td>

                      <td>
                        {item.mapLink ? (
                          <a
                            href={
                              item.mapLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Map
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {item.contact ||
                          "-"}
                      </td>

                      <td>
                        <input
                          type="text"
                          value={
                            visitedResponses[
                              item._id
                            ] || ""
                          }
                          onChange={(
                            event
                          ) =>
                            handleVisitedResponseChange(
                              item._id,
                              event.target
                                .value
                            )
                          }
                          onBlur={() =>
                            handleVisitedResponseSave(
                              item._id
                            )
                          }
                          placeholder="Enter visited response"
                          className="visited-response-input"
                        />
                      </td>

                      <td>
                        <span
                          className={`visited-pill ${
                            item.isAppointment
                              ? "yes"
                              : "no"
                          }`}
                        >
                          {item.isAppointment
                            ? "Yes"
                            : "No"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`visited-status-pill ${
                            item.isVisitedAppointment
                              ? "visited"
                              : "not-visited"
                          }`}
                        >
                          {item.isVisitedAppointment
                            ? "Visited"
                            : "Not Visited"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            background:
                              "#f59e0b",
                            color: "#ffffff"
                          }}
                          onClick={() =>
                            handleNotInterested(
                              item
                            )
                          }
                        >
                          Not Interested
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            marginTop: "36px",
            paddingTop: "24px",
            borderTop:
              "2px solid #fecaca"
          }}
        >
          <div className="visited-summary-card">
            <div>
              <h3>Not Interested</h3>

              <p>
                Visited appointments marked
                as Not Interested
              </p>
            </div>

            <span className="visited-count-badge">
              {
                filteredNotInterestedAppointments.length
              }
            </span>
          </div>

          {filteredNotInterestedAppointments
            .length === 0 ? (
            <p className="visited-empty">
              No Not Interested visited
              appointments found.
            </p>
          ) : (
            <div className="visited-table-wrapper">
              <table className="visited-table">
                <thead>
                  <tr>
                    <th>
                      Appointment Date
                    </th>
                    <th>Visited Date</th>
                    <th>Business Name</th>
                    <th>Map Link</th>
                    <th>Contact</th>
                    <th>
                      Visited Response
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredNotInterestedAppointments.map(
                    (item) => (
                      <tr key={item._id}>
                        <td>
                          {item.appointmentDate ||
                            item.date ||
                            "-"}
                        </td>

                        <td>
                          {item.visitedDate ||
                            "-"}
                        </td>

                        <td>
                          {item.businessName ||
                            "-"}
                        </td>

                        <td>
                          {item.mapLink ? (
                            <a
                              href={
                                item.mapLink
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Map
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          {item.contact ||
                            "-"}
                        </td>

                        <td>
                          {item.visitedResponse ||
                            "-"}
                        </td>

                        <td>
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "5px 10px",
                              borderRadius:
                                "999px",
                              background:
                                "#fee2e2",
                              color:
                                "#991b1b",
                              fontSize:
                                "12px",
                              fontWeight:
                                "700"
                            }}
                          >
                            {item.visitedRejectionReason ||
                              "Not Interested"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="visited-bottom-actions">
        <Link
          to="/ba/appointments"
          className="btn btn-secondary"
        >
          Back
        </Link>
      </div>
    </div>
  );
};

export default AppointmentVisitedPage;