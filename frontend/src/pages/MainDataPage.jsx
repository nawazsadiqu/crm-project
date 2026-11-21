import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useLocation
} from "react-router-dom";

import api from "../services/api";

import "../css/mainData.css";


const MainDataPage = () => {

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


  const [
    selectedDate,
    setSelectedDate
  ] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );


  const [
    formData,
    setFormData
  ] = useState({
    date: "",
    totalCalls: 0,
    totalPresentations: 0,
    totalAppointments: 0,
    appointmentsVisited: 0,
    forms: 0,
    revenue: 0
  });


  const [
    message,
    setMessage
  ] = useState("");


  useEffect(() => {

    const fetchMainData =
      async () => {

        try {

          const { data } =
            await api.get(
              `/main-data?date=${selectedDate}`
            );


          setFormData({
            date:
              data.date ||
              selectedDate,

            totalCalls:
              data.totalCalls ||
              0,

            totalPresentations:
              data.totalPresentations ||
              0,

            totalAppointments:
              data.totalAppointments ||
              0,

            appointmentsVisited:
              data.appointmentsVisited ||
              0,

            forms:
              data.forms ||
              0,

            revenue:
              data.revenue ||
              0
          });


          setMessage("");

        } catch (error) {

          console.error(
            "Failed to fetch main data:",
            error
          );

          setMessage(
            "Failed to fetch main data"
          );

        }

      };


    fetchMainData();

  }, [selectedDate]);


  const dataItems = [

    {
      label: "Date",
      value: formData.date,
      type: "text"
    },

    {
      label: "Total No of Calls",
      value:
        formData.totalCalls,
      type: "number"
    },

    {
      label: "No of Presentations",
      value:
        formData.totalPresentations,
      type: "number"
    },

    {
      label: "No of Appointments",
      value:
        formData.totalAppointments,
      type: "number"
    },

    /*
     * Appointment Visiting belongs
     * only to BA.
     */
    ...(
      isTelecaller
        ? []
        : [
          {
            label:
              "No of Appointments Visited",

            value:
              formData.appointmentsVisited,

            type:
              "number"
          }
        ]
    ),

    {
      label: "Forms",
      value:
        formData.forms,
      type: "number"
    },

    {
      label: "Revenue",
      value:
        formData.revenue,
      type: "number"
    }

  ];


  return (
    <div className="main-data-page">

      <div className="main-data-card">

        <div className="main-data-header">

          <div>

            <h2 className="main-data-title">
              Main Data
            </h2>

            <p className="main-data-subtitle">
              Daily summary of calls,
              presentations, appointments,
              forms and revenue
            </p>

          </div>

        </div>


        <div className="main-data-filter-card">

          <label>
            Select Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(
                event.target.value
              )
            }
          />

        </div>


        {message && (

          <p className="main-data-message">
            {message}
          </p>

        )}


        <div className="main-data-grid">

          {dataItems.map(
            (item) => (

              <div
                key={item.label}
                className="main-data-item"
              >

                <label>
                  {item.label}
                </label>

                <input
                  type={item.type}
                  value={item.value}
                  readOnly
                />

              </div>

            )
          )}

        </div>


        <div className="main-data-bottom-actions">

          <Link
            to={dataSheetPath}
            className="btn btn-secondary"
          >
            Back
          </Link>

        </div>

      </div>

    </div>
  );
};


export default MainDataPage;