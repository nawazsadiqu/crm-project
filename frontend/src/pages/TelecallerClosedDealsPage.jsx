import {
  Fragment,
  useEffect,
  useState
} from "react";

import {
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiSearch
} from "react-icons/fi";

import api from "../services/api";

import "../css/closedClients.css";


const TelecallerClosedDealsPage = () => {

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const currentMonth =
    today.slice(0, 7);


  const [
    view,
    setView
  ] = useState("all");


  const [
    selectedDate,
    setSelectedDate
  ] = useState(today);


  const [
    selectedMonth,
    setSelectedMonth
  ] = useState(currentMonth);


  const [
    search,
    setSearch
  ] = useState("");


  const [
    records,
    setRecords
  ] = useState([]);


  const [
    expandedId,
    setExpandedId
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    message,
    setMessage
  ] = useState("");


  /*
    ------------------------------------------------
    FETCH CLOSED DEALS
    ------------------------------------------------
  */

  const fetchRecords = async () => {

    try {

      setLoading(true);
      setMessage("");


      const params =
        new URLSearchParams();


      params.set(
        "view",
        view
      );


      if (
        view === "daily" ||
        view === "weekly"
      ) {

        params.set(
          "date",
          selectedDate
        );

      }


      if (
        view === "monthly"
      ) {

        params.set(
          "month",
          selectedMonth
        );

      }


      if (
        search.trim()
      ) {

        params.set(
          "search",
          search.trim()
        );

      }


      const { data } =
        await api.get(
          `/forms/closed-clients?${params.toString()}`
        );


      setRecords(
        Array.isArray(
          data?.records
        )
          ? data.records
          : []
      );


    } catch (error) {

      setRecords([]);

      setMessage(
        error.response?.data?.message ||
        "Failed to fetch closed deals"
      );

    } finally {

      setLoading(false);

    }

  };


  /*
    ------------------------------------------------
    AUTO FETCH
    ------------------------------------------------
  */

  useEffect(() => {

    const timer =
      setTimeout(
        () => {
          fetchRecords();
        },
        search ? 350 : 0
      );


    return () =>
      clearTimeout(timer);

  }, [
    view,
    selectedDate,
    selectedMonth,
    search
  ]);


  /*
    ------------------------------------------------
    FORMAT SERVICES
    ------------------------------------------------
  */

  const formatServices = (
    item
  ) => {

    const services = [

      ...(Array.isArray(
        item.googleServices
      )
        ? item.googleServices
        : []),


      ...(item.googleServicesOther
        ? [
          item.googleServicesOther
        ]
        : []),


      ...(Array.isArray(
        item.otherServices
      )
        ? item.otherServices
        : []),


      ...(item.otherServicesOther
        ? [
          item.otherServicesOther
        ]
        : [])

    ].filter(Boolean);


    return services.length
      ? services.join(", ")
      : "-";

  };


  /*
    ------------------------------------------------
    FORMAT BUSINESS TYPE
    ------------------------------------------------
  */

  const getBusinessType = (
    item
  ) => {

    if (
      item.typeOfBusiness ===
      "Other"
    ) {

      return (
        item.typeOfBusinessOther ||
        "Other"
      );

    }


    return (
      item.typeOfBusiness ||
      "-"
    );

  };


  /*
    ------------------------------------------------
    WEEK LABEL
    ------------------------------------------------
  */

  const getWeeklyLabel = () => {

    if (
      view !== "weekly" ||
      !selectedDate
    ) {

      return "";

    }


    const [
      year,
      month,
      day
    ] =
      selectedDate
        .split("-")
        .map(Number);


    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );


    const weekDay =
      date.getUTCDay();


    const difference =
      weekDay === 0
        ? -6
        : 1 - weekDay;


    const monday =
      new Date(date);


    monday.setUTCDate(
      date.getUTCDate() +
      difference
    );


    const sunday =
      new Date(monday);


    sunday.setUTCDate(
      monday.getUTCDate() +
      6
    );


    return `${monday
      .toISOString()
      .slice(
        0,
        10
      )} to ${sunday
        .toISOString()
        .slice(
          0,
          10
        )}`;

  };


  /*
    ------------------------------------------------
    UI
    ------------------------------------------------
  */

  return (

    <div className="closed-clients-page">


      {/* HEADER */}

      <div className="closed-clients-header">

        <div>

          <span className="closed-clients-eyebrow">
            BUSINESS HISTORY
          </span>

          <h2>
            Closed Deals
          </h2>

          <p>
            View businesses closed from
            your Telecaller appointments.
          </p>

        </div>


        <div className="closed-clients-header-icon">

          <FiBriefcase />

        </div>

      </div>


      {/* FILTER SECTION */}

      <div className="closed-clients-filters">


        <div className="closed-clients-filter-tabs">

          {[
            {
              value: "all",
              label: "All Time"
            },

            {
              value: "monthly",
              label: "Monthly"
            },

            {
              value: "weekly",
              label: "Weekly"
            },

            {
              value: "daily",
              label: "Daily"
            }

          ].map(
            (
              item
            ) => (

              <button
                type="button"
                key={
                  item.value
                }
                className={
                  view ===
                    item.value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setView(
                    item.value
                  )
                }
              >

                {item.label}

              </button>

            )
          )}

        </div>


        <div className="closed-clients-filter-controls">


          {/* MONTH FILTER */}

          {view ===
            "monthly" && (

              <div className="closed-clients-date-box">

                <FiCalendar />

                <input
                  type="month"
                  value={
                    selectedMonth
                  }
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value
                    )
                  }
                />

              </div>

            )}


          {/* DAILY / WEEKLY FILTER */}

          {(view ===
            "daily" ||
            view ===
            "weekly") && (

              <div className="closed-clients-date-box">

                <FiCalendar />

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                />

              </div>

            )}


          {/* SEARCH */}

          <div className="closed-clients-search">

            <FiSearch />

            <input
              type="text"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search business, owner, mobile, area..."
            />

          </div>

        </div>


        {/* WEEK DISPLAY */}

        {view ===
          "weekly" && (

            <p className="closed-clients-week-label">

              Week:{" "}

              {getWeeklyLabel()}

            </p>

          )}

      </div>


      {/* ERROR MESSAGE */}

      {message && (

        <div className="closed-clients-message">

          {message}

        </div>

      )}


      {/* CLOSED DEALS */}

      <div className="closed-clients-card">


        <div className="closed-clients-table-header">

          <div>

            <h3>
              Closed Businesses
            </h3>

            <p>

              {records.length}{" "}

              {records.length ===
                1
                ? "business"
                : "businesses"}{" "}

              found

            </p>

          </div>


          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              fetchRecords
            }
          >

            Refresh

          </button>

        </div>


        {/* LOADING */}

        {loading ? (

          <div className="closed-clients-empty">

            Loading closed deals...

          </div>

        ) : records.length ===
          0 ? (

          <div className="closed-clients-empty">

            No closed businesses found
            for this filter.

          </div>

        ) : (

          <div className="closed-clients-table-wrapper">


            <table className="closed-clients-table">


              <thead>

                <tr>

                  <th>
                    Closed Date
                  </th>

                  <th>
                    Business
                  </th>

                  <th>
                    Owner
                  </th>

                  <th>
                    Mobile
                  </th>

                  <th>
                    Area
                  </th>

                  <th>
                    Services
                  </th>

                  <th>
                    Closed By BA
                  </th>

                  <th>
                    Details
                  </th>

                </tr>

              </thead>


              <tbody>


                {records.map(
                  (
                    item
                  ) => (

                    <Fragment
                      key={
                        item._id
                      }
                    >


                      {/* MAIN ROW */}

                      <tr>

                        <td>

                          {item.date ||
                            "-"}

                        </td>


                        <td>

                          <strong>

                            {item.businessName ||
                              "-"}

                          </strong>

                          <small>

                            {item.city ||
                              ""}

                          </small>

                        </td>


                        <td>

                          {item.fullName ||
                            "-"}

                        </td>


                        <td>

                          {item.mobileNumber ? (

                            <a
                              className="closed-client-phone"
                              href={`tel:${item.mobileNumber}`}
                            >

                              <FiPhone />

                              {
                                item.mobileNumber
                              }

                            </a>

                          ) : (

                            "-"

                          )}

                        </td>


                        <td>

                          {item.area ||
                            item.city ||
                            "-"}

                        </td>


                        <td className="closed-client-services-cell">

                          {formatServices(
                            item
                          )}

                        </td>


                        <td>

                          {item.baName ||
                            "-"}

                        </td>


                        <td>

                          <button
                            type="button"
                            className="closed-client-details-btn"
                            onClick={() =>
                              setExpandedId(
                                (
                                  previous
                                ) =>
                                  previous ===
                                    item._id
                                    ? null
                                    : item._id
                              )
                            }
                          >

                            {expandedId ===
                              item._id
                              ? "Hide"
                              : "View"}

                          </button>

                        </td>

                      </tr>


                      {/* EXPANDED DETAILS */}

                      {expandedId ===
                        item._id && (

                          <tr className="closed-client-expanded-row">

                            <td
                              colSpan="8"
                            >

                              <div className="closed-client-details-panel">


                                {/* BUSINESS DETAILS */}

                                <section>

                                  <h4>
                                    Business Details
                                  </h4>


                                  <div className="closed-client-detail-grid">


                                    <p>

                                      <span>
                                        Business Name
                                      </span>

                                      <strong>

                                        {item.businessName ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Owner Name
                                      </span>

                                      <strong>

                                        {item.fullName ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Mobile Number
                                      </span>

                                      <strong>

                                        {item.mobileNumber ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Email
                                      </span>

                                      <strong>

                                        {item.email ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Business Type
                                      </span>

                                      <strong>

                                        {getBusinessType(
                                          item
                                        )}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Closed Date
                                      </span>

                                      <strong>

                                        {item.date ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        City
                                      </span>

                                      <strong>

                                        {item.city ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Area
                                      </span>

                                      <strong>

                                        {item.area ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Pincode
                                      </span>

                                      <strong>

                                        {item.pincode ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        Closed By BA
                                      </span>

                                      <strong>

                                        {item.baName ||
                                          "-"}

                                      </strong>

                                    </p>


                                    {item.baId && (

                                      <p>

                                        <span>
                                          BA ID
                                        </span>

                                        <strong>

                                          {item.baId}

                                        </strong>

                                      </p>

                                    )}


                                    <p>

                                      <span>
                                        GST Number
                                      </span>

                                      <strong>

                                        {item.gstNumber ||
                                          "-"}

                                      </strong>

                                    </p>


                                    <p>

                                      <span>
                                        GST Invoice Name
                                      </span>

                                      <strong>

                                        {item.gstInvoiceName ||
                                          "-"}

                                      </strong>

                                    </p>


                                  </div>


                                  {/* ADDRESS */}

                                  <div className="closed-client-full-detail">

                                    <span>
                                      Address
                                    </span>

                                    <strong>

                                      {item.address ||
                                        "-"}

                                    </strong>

                                  </div>


                                  {/* GOOGLE MAP */}

                                  <div className="closed-client-full-detail">

                                    <span>
                                      Google Map
                                    </span>


                                    {item.googleMapLink ? (

                                      <a
                                        href={
                                          item.googleMapLink
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >

                                        <FiMapPin />

                                        Open Location

                                      </a>

                                    ) : (

                                      <strong>
                                        -
                                      </strong>

                                    )}

                                  </div>

                                </section>


                                {/* SERVICE DETAILS */}

                                <section>

                                  <h4>
                                    Service Details
                                  </h4>


                                  <div className="closed-client-full-detail">

                                    <span>
                                      Service Category
                                    </span>


                                    <strong>

                                      {item.serviceCategory ===
                                        "googleServices"

                                        ? "Google Services"

                                        : item.serviceCategory ===
                                          "otherServices"

                                          ? "Other Services"

                                          : "-"}

                                    </strong>

                                  </div>


                                  <div className="closed-client-full-detail">

                                    <span>
                                      Selected Services
                                    </span>


                                    <strong>

                                      {formatServices(
                                        item
                                      )}

                                    </strong>

                                  </div>

                                </section>


                              </div>

                            </td>

                          </tr>

                        )}


                    </Fragment>

                  )
                )}


              </tbody>


            </table>


          </div>

        )}


      </div>


    </div>

  );

};


export default TelecallerClosedDealsPage;