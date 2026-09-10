import {
  Fragment,
  useEffect,
  useMemo,
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

const ClosedClientsPage = () => {
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
    clients,
    setClients
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

  const fetchClosedClients =
    async () => {
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

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        const { data } =
          await api.get(
            `/forms/closed-clients?${params.toString()}`
          );

        setClients(
          Array.isArray(
            data?.records
          )
            ? data.records
            : []
        );
      } catch (error) {
        setClients([]);

        setMessage(
          error.response?.data
            ?.message ||
            "Failed to fetch closed clients"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const timer =
      setTimeout(() => {
        fetchClosedClients();
      }, search ? 350 : 0);

    return () =>
      clearTimeout(timer);
  }, [
    view,
    selectedDate,
    selectedMonth,
    search
  ]);

  const getReceivedAmount = (
    item
  ) => {
    return Number(
      item.totalReceivedAmount ||
        item.revenue ||
        0
    );
  };

  const getPackageAmount = (
    item
  ) => {
    return Number(
      item.packageAmount ||
        item.revenue ||
        0
    );
  };

  const getBalanceAmount = (
    item
  ) => {
    const stored =
      Number(
        item.balanceAmount ||
          0
      );

    if (
      Number.isFinite(stored)
    ) {
      return stored;
    }

    return Math.max(
      getPackageAmount(item) -
        getReceivedAmount(item),
      0
    );
  };

  const formatCurrency = (
    value
  ) => {
    return `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          2
      }
    )}`;
  };

  const formatServices = (
    item
  ) => {
    const values = [
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

    return values.length
      ? values.join(", ")
      : "-";
  };

  const getPaymentTransactions = (
    item
  ) => {
    const payments = [];

    const firstAmount =
      Number(
        item.amountReceivedNow ||
          0
      );

    if (
      firstAmount > 0 ||
      item.transactionIdOrChequeNumber
    ) {
      payments.push({
        label:
          "1st Payment",

        date:
          item.date || "",

        amount:
          firstAmount ||
          Number(
            item.revenue ||
              0
          ),

        mode:
          item.paymentDetails ===
          "Other"
            ? item.paymentDetailsOther ||
              "Other"
            : item.paymentDetails ||
              "-",

        transaction:
          item.transactionIdOrChequeNumber ||
          "-"
      });
    }

    if (
      Array.isArray(
        item.paymentHistory
      )
    ) {
      item.paymentHistory.forEach(
        (payment, index) => {
          payments.push({
            label:
              `${index + 2}${
                index + 2 === 2
                  ? "nd"
                  : index + 2 ===
                    3
                  ? "rd"
                  : "th"
              } Payment`,

            date:
              payment.paymentDate ||
              "",

            amount:
              Number(
                payment.amount ||
                  0
              ),

            mode:
              payment.paymentDetails ===
              "Other"
                ? payment.paymentDetailsOther ||
                  "Other"
                : payment.paymentDetails ||
                  "-",

            transaction:
              payment.transactionIdOrChequeNumber ||
              "-"
          });
        }
      );
    }

    return payments;
  };

  const summary =
    useMemo(() => {
      return clients.reduce(
        (acc, item) => {
          acc.clients += 1;

          acc.packageAmount +=
            getPackageAmount(
              item
            );

          acc.received +=
            getReceivedAmount(
              item
            );

          acc.balance +=
            getBalanceAmount(
              item
            );

          return acc;
        },
        {
          clients: 0,
          packageAmount: 0,
          received: 0,
          balance: 0
        }
      );
    }, [clients]);

  const getWeeklyLabel = () => {
    if (
      view !== "weekly" ||
      !selectedDate
    ) {
      return "";
    }

    const [year, month, day] =
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

    const diff =
      weekDay === 0
        ? -6
        : 1 - weekDay;

    const monday =
      new Date(date);

    monday.setUTCDate(
      date.getUTCDate() +
        diff
    );

    const sunday =
      new Date(monday);

    sunday.setUTCDate(
      monday.getUTCDate() +
        6
    );

    return `${monday
      .toISOString()
      .slice(0, 10)} to ${sunday
      .toISOString()
      .slice(0, 10)}`;
  };

  return (
    <div className="closed-clients-page">
      <div className="closed-clients-header">
        <div>
          <span className="closed-clients-eyebrow">
            CLIENT HISTORY
          </span>

          <h2>
            Closed Deals
          </h2>

          <p>
            View all businesses you
            have closed from the
            beginning.
          </p>
        </div>

        <div className="closed-clients-header-icon">
          <FiBriefcase />
        </div>
      </div>

      <div className="closed-clients-filters">
        <div className="closed-clients-filter-tabs">
          {[
            {
              value:
                "all",
              label:
                "All Time"
            },
            {
              value:
                "monthly",
              label:
                "Monthly"
            },
            {
              value:
                "weekly",
              label:
                "Weekly"
            },
            {
              value:
                "daily",
              label:
                "Daily"
            }
          ].map((item) => (
            <button
              type="button"
              key={item.value}
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
          ))}
        </div>

        <div className="closed-clients-filter-controls">
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

          <div className="closed-clients-search">
            <FiSearch />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search business, owner, number, area..."
            />
          </div>
        </div>

        {view ===
          "weekly" && (
          <p className="closed-clients-week-label">
            Week:{" "}
            {getWeeklyLabel()}
          </p>
        )}
      </div>

      <div className="closed-clients-summary-grid">
        <div className="closed-client-summary-card">
          <span>
            Closed Clients
          </span>

          <strong>
            {summary.clients}
          </strong>
        </div>

        <div className="closed-client-summary-card">
          <span>
            Package Amount
          </span>

          <strong>
            {formatCurrency(
              summary.packageAmount
            )}
          </strong>
        </div>

        <div className="closed-client-summary-card">
          <span>
            Total Received
          </span>

          <strong>
            {formatCurrency(
              summary.received
            )}
          </strong>
        </div>

        <div className="closed-client-summary-card">
          <span>
            Pending Balance
          </span>

          <strong>
            {formatCurrency(
              summary.balance
            )}
          </strong>
        </div>
      </div>

      {message && (
        <div className="closed-clients-message">
          {message}
        </div>
      )}

      <div className="closed-clients-card">
        <div className="closed-clients-table-header">
          <div>
            <h3>
              Client Records
            </h3>

            <p>
              {clients.length}{" "}
              {clients.length ===
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
              fetchClosedClients
            }
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="closed-clients-empty">
            Loading closed
            clients...
          </div>
        ) : clients.length ===
          0 ? (
          <div className="closed-clients-empty">
            No closed clients found
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
                    Services
                  </th>

                  <th>
                    Package
                  </th>

                  <th>
                    Received
                  </th>

                  <th>
                    Balance
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {clients.map(
                  (item) => (
                    <Fragment
                      key={
                        item._id
                      }
                    >
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
                            {item.area ||
                              item.city ||
                              ""}
                          </small>
                        </td>

                        <td>
                          {item.fullName ||
                            "-"}
                        </td>

                        <td>
                          <a
                            className="closed-client-phone"
                            href={`tel:${
                              item.mobileNumber ||
                              ""
                            }`}
                          >
                            <FiPhone />
                            {item.mobileNumber ||
                              "-"}
                          </a>
                        </td>

                        <td className="closed-client-services-cell">
                          {formatServices(
                            item
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            getPackageAmount(
                              item
                            )
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            getReceivedAmount(
                              item
                            )
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            getBalanceAmount(
                              item
                            )
                          )}
                        </td>

                        <td>
                          <span
                            className={`closed-client-status ${
                              getBalanceAmount(
                                item
                              ) >
                              0
                                ? "pending"
                                : "paid"
                            }`}
                          >
                            {item.paymentStatus ||
                              (getBalanceAmount(
                                item
                              ) >
                              0
                                ? "Partially Paid"
                                : "Paid")}
                          </span>
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

                      {expandedId ===
                        item._id && (
                        <tr className="closed-client-expanded-row">
                          <td
                            colSpan="10"
                          >
                            <div className="closed-client-details-panel">
                              <section>
                                <h4>
                                  Business
                                  Details
                                </h4>

                                <div className="closed-client-detail-grid">
                                  <p>
                                    <span>
                                      Business
                                      Name
                                    </span>
                                    <strong>
                                      {item.businessName ||
                                        "-"}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Owner
                                      Name
                                    </span>
                                    <strong>
                                      {item.fullName ||
                                        "-"}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Mobile
                                      Number
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
                                      Business
                                      Type
                                    </span>
                                    <strong>
                                      {item.typeOfBusiness ===
                                      "Other"
                                        ? item.typeOfBusinessOther ||
                                          "Other"
                                        : item.typeOfBusiness ||
                                          "-"}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Closed
                                      Date
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
                                </div>

                                <div className="closed-client-full-detail">
                                  <span>
                                    Address
                                  </span>

                                  <strong>
                                    {item.address ||
                                      "-"}
                                  </strong>
                                </div>

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
                                      Open
                                      Location
                                    </a>
                                  ) : (
                                    <strong>
                                      -
                                    </strong>
                                  )}
                                </div>
                              </section>

                              <section>
                                <h4>
                                  Payment
                                  Details
                                </h4>

                                <div className="closed-client-detail-grid">
                                  <p>
                                    <span>
                                      Package
                                      Amount
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        getPackageAmount(
                                          item
                                        )
                                      )}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Total
                                      Received
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        getReceivedAmount(
                                          item
                                        )
                                      )}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Balance
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        getBalanceAmount(
                                          item
                                        )
                                      )}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Ex GST
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        item.exGst
                                      )}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Profit
                                      Sharing
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        item.profitSharing
                                      )}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Payment
                                      Status
                                    </span>

                                    <strong>
                                      {item.paymentStatus ||
                                        "-"}
                                    </strong>
                                  </p>

                                  <p>
                                    <span>
                                      Payment
                                      Type
                                    </span>

                                    <strong>
                                      {item.paymentType ===
                                      "partial"
                                        ? "Partial"
                                        : item.paymentType ===
                                          "additional"
                                        ? "Additional"
                                        : "Complete"}
                                    </strong>
                                  </p>

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
                                      GST Invoice
                                      Name
                                    </span>

                                    <strong>
                                      {item.gstInvoiceName ||
                                        "-"}
                                    </strong>
                                  </p>
                                </div>
                              </section>

                              <section>
                                <h4>
                                  Services
                                </h4>

                                <div className="closed-client-full-detail">
                                  <span>
                                    Service
                                    Category
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
                                    Selected
                                    Services
                                  </span>

                                  <strong>
                                    {formatServices(
                                      item
                                    )}
                                  </strong>
                                </div>
                              </section>

                              <section>
                                <h4>
                                  Payment
                                  Transactions
                                </h4>

                                <div className="closed-client-payment-list">
                                  {getPaymentTransactions(
                                    item
                                  ).length ===
                                  0 ? (
                                    <p>
                                      No payment
                                      transactions
                                      found.
                                    </p>
                                  ) : (
                                    getPaymentTransactions(
                                      item
                                    ).map(
                                      (
                                        payment,
                                        index
                                      ) => (
                                        <div
                                          key={`${item._id}-${index}`}
                                          className="closed-client-payment-item"
                                        >
                                          <strong>
                                            {
                                              payment.label
                                            }
                                          </strong>

                                          <span>
                                            Date:{" "}
                                            {payment.date ||
                                              "-"}
                                          </span>

                                          <span>
                                            Amount:{" "}
                                            {formatCurrency(
                                              payment.amount
                                            )}
                                          </span>

                                          <span>
                                            Mode:{" "}
                                            {payment.mode ||
                                              "-"}
                                          </span>

                                          <span>
                                            Transaction:
                                            {" "}
                                            {payment.transaction ||
                                              "-"}
                                          </span>
                                        </div>
                                      )
                                    )
                                  )}
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

export default ClosedClientsPage;