import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import "../css/hrSummary.css";

const HrCallSummary = () => {
  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [
    viewType,
    setViewType,
  ] = useState("daily");

  const [data, setData] =
    useState(null);

  const [
    selectedCard,
    setSelectedCard,
  ] = useState(null);

  const getWeekValue = (
    dateString
  ) => {
    const selectedDate =
      new Date(dateString);

    const yearStart =
      new Date(
        selectedDate.getFullYear(),
        0,
        1
      );

    const days =
      Math.floor(
        (selectedDate -
          yearStart) /
          (
            24 *
            60 *
            60 *
            1000
          )
      );

    const weekNumber =
      Math.ceil(
        (
          days +
          yearStart.getDay() +
          1
        ) / 7
      );

    return `${selectedDate.getFullYear()}-W${String(
      weekNumber
    ).padStart(2, "0")}`;
  };

  const getDateFromWeek = (
    weekValue
  ) => {
    const [year, week] =
      weekValue.split("-W");

    const firstDayOfYear =
      new Date(
        Number(year),
        0,
        1
      );

    const days =
      (Number(week) - 1) *
      7;

    const weekDate =
      new Date(
        firstDayOfYear
      );

    weekDate.setDate(
      firstDayOfYear.getDate() +
        days
    );

    return weekDate
      .toISOString()
      .split("T")[0];
  };

  useEffect(() => {
    const fetchSummary =
      async () => {
        try {
          setData(null);
          setSelectedCard(null);

          const res =
            await api.get(
              `/hr-calls/summary?date=${date}&type=${viewType}`
            );

          setData(
            res.data
          );
        } catch (error) {
          console.error(
            "Failed to fetch HR summary",
            error
          );

          setData(null);
        }
      };

    fetchSummary();
  }, [date, viewType]);

  if (!data) {
    return <p>Loading...</p>;
  }

  const cards = [
    {
      key: "total",
      title: "Total Calls",
      value: data.total,
      className: "total",
    },
    {
      key: "interested",
      title: "Interested",
      value:
        data.interested,
      className: "green",
    },
    {
      key: "notInterested",
      title:
        "Not Interested",
      value:
        data.notInterested,
      className: "red",
    },
    {
      key: "notSelected",
      title:
        "Not Selected",
      value:
        data.notSelected,
      className: "red",
    },
    {
      key: "callBack",
      title: "Call Back",
      value:
        data.callBack,
      className: "yellow",
    },
    {
      key: "notLifting",
      title:
        "Not Lifting",
      value:
        data.notLifting,
      className: "blue",
    },
    {
      key: "notConnected",
      title:
        "Not Connected",
      value:
        data.notConnected,
      className: "blue",
    },

    /*
     * New HR pipeline cards
     */
    {
      key: "resumeGot",
      title: "Resume Got",
      value:
        data.resumeGot,
      className: "green",
    },
    {
      key: "firstRound",
      title: "First Round",
      value:
        data.firstRound,
      className: "yellow",
    },
    {
      key: "secondRound",
      title: "Second Round",
      value:
        data.secondRound,
      className: "blue",
    },
  ];

  const selectedDetails =
    selectedCard
      ? data.details?.[
          selectedCard.key
        ] || []
      : [];

  return (
    <div className="summary-container">
      <h1>
        HR Call Summary
      </h1>

      <div className="summary-filters">

        {viewType ===
          "daily" && (
          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />
        )}

        {viewType ===
          "weekly" && (
          <input
            type="week"
            value={getWeekValue(
              date
            )}
            onChange={(e) =>
              setDate(
                getDateFromWeek(
                  e.target.value
                )
              )
            }
          />
        )}

        {viewType ===
          "monthly" && (
          <input
            type="month"
            value={date.slice(
              0,
              7
            )}
            onChange={(e) =>
              setDate(
                `${e.target.value}-01`
              )
            }
          />
        )}

        <div className="summary-tabs">

          <button
            className={
              viewType ===
              "daily"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewType(
                "daily"
              )
            }
          >
            Daily
          </button>

          <button
            className={
              viewType ===
              "weekly"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewType(
                "weekly"
              )
            }
          >
            Weekly
          </button>

          <button
            className={
              viewType ===
              "monthly"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewType(
                "monthly"
              )
            }
          >
            Monthly
          </button>

        </div>
      </div>

      <div className="summary-grid">
        {cards.map(
          (card) => (
            <div
              key={
                card.key
              }
              className={`card ${card.className}`}
              role="button"
              tabIndex="0"
              style={{
                cursor:
                  "pointer",
              }}
              onClick={() =>
                setSelectedCard(
                  card
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                    "Enter" ||
                  e.key === " "
                ) {
                  setSelectedCard(
                    card
                  );
                }
              }}
            >
              <h3>
                {card.title}
              </h3>

              <p>
                {card.value ??
                  0}
              </p>
            </div>
          )
        )}
      </div>

      {/* Details modal */}

      {selectedCard && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            zIndex: 9999,
            padding:
              "20px",
          }}
          onClick={() =>
            setSelectedCard(
              null
            )
          }
        >
          <div
            style={{
              width:
                "1000px",
              maxWidth:
                "95vw",
              maxHeight:
                "85vh",
              overflow:
                "auto",
              background:
                "#fff",
              borderRadius:
                "12px",
              padding:
                "22px",
              boxSizing:
                "border-box",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "16px",
                marginBottom:
                  "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {
                    selectedCard.title
                  }
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                  }}
                >
                  {
                    selectedDetails.length
                  }{" "}
                  record
                  {selectedDetails.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCard(
                    null
                  )
                }
                style={{
                  padding:
                    "8px 14px",
                  cursor:
                    "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>
                      Date
                    </th>

                    <th>
                      Call No.
                    </th>

                    <th>
                      Candidate Name
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Job Portal
                    </th>

                    <th>
                      Qualification
                    </th>

                    <th>
                      Location
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedDetails.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          textAlign:
                            "center",
                        }}
                      >
                        No records found
                      </td>
                    </tr>
                  ) : (
                    selectedDetails.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item._id ||
                            `${selectedCard.key}-${index}`
                          }
                        >
                          <td>
                            {item.date ||
                              "-"}
                          </td>

                          <td>
                            {item.callNumber ||
                              "-"}
                          </td>

                          <td>
                            {item.candidateName ||
                              "-"}
                          </td>

                          <td>
                            {item.contactNumber ||
                              "-"}
                          </td>

                          <td>
                            {item.jobPortal ||
                              "-"}
                          </td>

                          <td>
                            {item.qualification ||
                              "-"}
                          </td>

                          <td>
                            {item.location ||
                              "-"}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HrCallSummary;