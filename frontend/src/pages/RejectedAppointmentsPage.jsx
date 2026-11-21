import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useLocation
} from "react-router-dom";

import api from "../services/api";
import "../css/appointments.css";


const RejectedAppointmentsPage = () => {

  /*
  ==========================================
  ROLE / ROUTE
  ==========================================
  */

  const location =
    useLocation();


  const isTelecaller =
    location.pathname.startsWith(
      "/telecaller"
    );


  const dataSheetPath =
    isTelecaller
      ? "/telecaller/data-sheet"
      : "/ba/data-sheet";


  /*
  ==========================================
  CURRENT MONTH
  ==========================================
  */

  const currentMonth =
    new Date()
      .toISOString()
      .slice(0, 7);


  /*
  ==========================================
  STATE
  ==========================================
  */

  const [
    selectedMonth,
    setSelectedMonth
  ] = useState(
    currentMonth
  );


  const [
    rejectedAppointments,
    setRejectedAppointments
  ] = useState([]);


  const [
    searchTerm,
    setSearchTerm
  ] = useState("");


  const [
    message,
    setMessage
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(false);


  /*
  ==========================================
  FETCH REJECTED APPOINTMENTS
  ==========================================
  */

  const fetchRejectedAppointments =
    async () => {

      try {

        setLoading(true);


        const { data } =
          await api.get(
            `/presentation-details/rejected-appointments?month=${selectedMonth}`
          );


        setRejectedAppointments(
          Array.isArray(data)
            ? data
            : []
        );


        setMessage("");

      } catch (error) {

        console.error(
          "Failed to fetch rejected appointments:",
          error
        );


        setRejectedAppointments(
          []
        );


        setMessage(
          error.response
            ?.data
            ?.message ||
          "Failed to fetch rejected appointments"
        );

      } finally {

        setLoading(false);

      }

    };


  /*
  ==========================================
  FETCH WHEN MONTH CHANGES
  ==========================================
  */

  useEffect(() => {

    fetchRejectedAppointments();

  }, [selectedMonth]);


  /*
  ==========================================
  SEARCH
  ==========================================
  */

  const filteredRejectedAppointments =
    rejectedAppointments.filter(
      (item) => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();


        if (
          !search
        ) {
          return true;
        }


        return [

          item.date,

          item.appointmentDate,

          item.presentationNumber,

          item.status,

          item.rejectionReason,

          item.visitedRejectionReason,

          item.businessName,

          item.mapLink,

          item.contact,

          item.response,

          item.notes,

          item.visitedDate

        ]

          .map(
            (value) =>
              String(
                value ||
                ""
              ).toLowerCase()
          )

          .join(" ")

          .includes(
            search
          );

      }
    );


  /*
  ==========================================
  DISPLAY STATUS
  ==========================================
  */

  const getDisplayedStatus = (
    item
  ) => {

    /*
    Rejected after visit
    */

    if (
      item.isVisitedNotInterested
    ) {

      return (
        item.visitedRejectionReason ||
        "Not Interested"
      );

    }


    /*
    Rejected from appointment
    */

    if (
      item.rejectedFromAppointment
    ) {

      return (
        item.rejectionReason ||
        "Not Interested"
      );

    }


    return (
      item.status ||
      "Rejected"
    );

  };


  /*
  ==========================================
  STATUS STYLE
  ==========================================
  */

  const getStatusStyle = (
    item
  ) => {

    if (
      item.isVisitedNotInterested ||
      item.rejectedFromAppointment
    ) {

      return {
        background:
          "#fee2e2",

        color:
          "#991b1b"
      };

    }


    return {
      background:
        "#fef3c7",

      color:
        "#92400e"
    };

  };


  /*
  ==========================================
  UI
  ==========================================
  */

  return (

    <div className="appointments-page">


      <div className="appointments-card">


        {/* HEADER */}

        <div className="appointments-header">

          <div>

            <h2 className="appointments-title">

              Rejected Appointments

            </h2>


            <p className="appointments-subtitle">

              Rejected and Not Interested
              records from Presentation

            </p>

          </div>

        </div>


        {/* FILTERS */}

        <div className="appointments-top-bar">


          <div className="appointments-filter-card">

            <label>

              Select Month

            </label>


            <input
              type="month"
              value={
                selectedMonth
              }
              onChange={(
                event
              ) =>
                setSelectedMonth(
                  event.target.value
                )
              }
            />

          </div>


          <div className="appointments-filter-card appointments-search-card">

            <label>

              Search

            </label>


            <input
              type="text"
              placeholder="Search rejected records..."
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          <div className="appointments-actions">

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                fetchRejectedAppointments
              }
              disabled={
                loading
              }
            >

              {loading
                ? "Loading..."
                : "Refresh"}

            </button>

          </div>

        </div>


        {/* MESSAGE */}

        {message && (

          <p className="appointments-message">

            {message}

          </p>

        )}


        {/* SUMMARY */}

        <div className="appointments-summary-card">

          <div>

            <h3>

              Rejected Records

            </h3>


            <p>

              Rejected and Not Interested
              records for the selected month

            </p>

          </div>


          <span className="appointments-count-badge">

            {
              filteredRejectedAppointments.length
            }

          </span>

        </div>


        {/* TABLE */}

        {loading ? (

          <p className="appointments-loading">

            Loading rejected records...

          </p>

        ) : filteredRejectedAppointments
          .length ===
          0 ? (

          <p className="appointments-empty">

            No rejected records found for
            this month.

          </p>

        ) : (

          <div className="appointments-table-wrapper">

            <table className="appointments-table">


              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Appointment Date
                  </th>

                  <th>
                    Presentation No
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Business Name
                  </th>

                  <th>
                    Map Link
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Response
                  </th>

                  <th>
                    Notes
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredRejectedAppointments.map(
                  (item) => (

                    <tr
                      key={
                        item._id
                      }
                    >


                      {/* DATE */}

                      <td>

                        {item.date ||
                          "-"}

                      </td>


                      {/* APPOINTMENT DATE */}

                      <td>

                        {item.appointmentDate ||
                          "-"}

                      </td>


                      {/* PRESENTATION NUMBER */}

                      <td>

                        {item.presentationNumber ??
                          "-"}

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className="status-pill"
                          style={
                            getStatusStyle(
                              item
                            )
                          }
                        >

                          {
                            getDisplayedStatus(
                              item
                            )
                          }

                        </span>

                      </td>


                      {/* BUSINESS */}

                      <td>

                        {item.businessName ||
                          "-"}

                      </td>


                      {/* MAP */}

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


                      {/* CONTACT */}

                      <td>

                        {item.contact ||
                          "-"}

                      </td>


                      {/* RESPONSE */}

                      <td>

                        {item.response ||
                          item.visitedResponse ||
                          "-"}

                      </td>


                      {/* NOTES */}

                      <td>

                        {item.notes ||
                          "-"}

                      </td>


                    </tr>

                  )
                )}

              </tbody>


            </table>

          </div>

        )}


      </div>


      {/* BACK */}

      <div className="appointments-bottom-actions">

        <Link
          to={
            dataSheetPath
          }
          className="btn btn-secondary"
        >

          Back

        </Link>

      </div>


    </div>

  );

};


export default RejectedAppointmentsPage;