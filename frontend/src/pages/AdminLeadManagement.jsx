import {
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../services/api";
import "../css/adminLeadManagement.css";

const AdminLeadManagement = () => {
    const [leads, setLeads] = useState([]);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [selectedBa, setSelectedBa] =
        useState("ALL");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    /*
      ALL = All-time data.
  
      Selecting 2026-11, 2026-10 etc.
      filters the complete Lead Management
      dashboard to that appointment month.
    */
    const [
        selectedMonth,
        setSelectedMonth
    ] = useState("ALL");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
      =========================================
      FETCH LEAD MANAGEMENT
      =========================================
    */

    const fetchLeadManagement = async () => {
        try {
            setLoading(true);
            setError("");

            const { data } = await api.get(
                "/admin/lead-management"
            );

            setLeads(
                Array.isArray(data?.leads)
                    ? data.leads
                    : []
            );
        } catch (error) {
            console.error(
                "Failed to fetch lead management data",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load lead management data"
            );

            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeadManagement();
    }, []);

    /*
      =========================================
      BA OPTIONS
      =========================================
    */

    const baOptions = useMemo(() => {
        const names = leads
            .map((item) => item.baName)
            .filter(Boolean);

        return [...new Set(names)].sort(
            (a, b) =>
                a.localeCompare(b)
        );
    }, [leads]);

    /*
      =========================================
      MONTH OPTIONS
      =========================================
  
      Primary:
      appointmentDate
  
      Fallback:
      appointmentFixedDate
    */

    const monthOptions = useMemo(() => {
        const months = leads
            .map((item) => {
                const date =
                    item.appointmentDate ||
                    item.appointmentFixedDate ||
                    "";

                if (!date) {
                    return "";
                }

                return date.slice(0, 7);
            })
            .filter(Boolean);

        return [...new Set(months)].sort(
            (a, b) =>
                b.localeCompare(a)
        );
    }, [leads]);

    /*
      Example:
      2026-11 → November 2026
    */

    const formatMonthLabel = (value) => {
        if (!value) {
            return "";
        }

        const [year, month] =
            value.split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            1
        );

        return date.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );
    };

    /*
      =========================================
      MONTH FILTER
      =========================================
    */

    const monthFilteredLeads =
        useMemo(() => {
            if (selectedMonth === "ALL") {
                return leads;
            }

            return leads.filter((item) => {
                const date =
                    item.appointmentDate ||
                    item.appointmentFixedDate ||
                    "";

                return date.startsWith(
                    selectedMonth
                );
            });
        }, [leads, selectedMonth]);

    /*
      =========================================
      SUMMARY
  
      IMPORTANT:
      Calculated from monthFilteredLeads.
  
      So:
      ALL → all-time summary
      Month → monthly summary
      =========================================
    */

    const displaySummary = useMemo(() => {
        const countStatus = (status) =>
            monthFilteredLeads.filter(
                (item) =>
                    item.leadStatus === status
            ).length;

        const dealClosed =
            countStatus("DEAL_CLOSED");

        const visitedNotClosed =
            countStatus(
                "VISITED_NOT_CLOSED"
            );

        const notInterested =
            countStatus(
                "NOT_INTERESTED"
            ) +
            countStatus(
                "VISITED_NOT_INTERESTED"
            );

        const closedRevenue =
            monthFilteredLeads.reduce(
                (total, item) => {
                    if (!item.hasClosedDeal) {
                        return total;
                    }

                    return (
                        total +
                        Number(
                            item.revenue || 0
                        )
                    );
                },
                0
            );

        return {
            total:
                monthFilteredLeads.length,

            upcoming:
                countStatus("UPCOMING"),

            dueToday:
                countStatus("DUE_TODAY"),

            overdue:
                countStatus("OVERDUE"),

            visitedNotClosed,

            dealClosed,

            notInterested,

            unscheduled:
                countStatus("UNSCHEDULED"),

            closedRevenue
        };
    }, [monthFilteredLeads]);

    /*
      =========================================
      SEARCH + BA + STATUS FILTER
      =========================================
    */

    const filteredLeads =
        useMemo(() => {
            const search = searchTerm
                .trim()
                .toLowerCase();

            const filtered =
                monthFilteredLeads.filter(
                    (item) => {
                        const matchesSearch =
                            !search ||
                            [
                                item.businessName,
                                item.contact,
                                item.baName,
                                item.appointmentDate,
                                item.appointmentTime,
                                item.visitedDate,
                                item.visitedResponse,
                                item.rejectionReason,
                                item.visitedRejectionReason,
                                item.notes,
                                item.leadStatus,
                                item.closedDealDate,
                                item.revenue
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase()
                                .includes(search);

                        const matchesBa =
                            selectedBa === "ALL" ||
                            item.baName === selectedBa;

                        let matchesStatus = true;

                        if (
                            statusFilter !== "ALL"
                        ) {
                            /*
                              Both appointment rejection
                              and visited rejection appear
                              under Not Interested.
                            */
                            if (
                                statusFilter ===
                                "NOT_INTERESTED"
                            ) {
                                matchesStatus =
                                    item.leadStatus ===
                                    "NOT_INTERESTED" ||
                                    item.leadStatus ===
                                    "VISITED_NOT_INTERESTED";
                            } else {
                                matchesStatus =
                                    item.leadStatus ===
                                    statusFilter;
                            }
                        }

                        return (
                            matchesSearch &&
                            matchesBa &&
                            matchesStatus
                        );
                    }
                );

            /*
              When looking at overdue leads,
              show longest overdue first.
            */

            if (
                statusFilter === "OVERDUE"
            ) {
                return [...filtered].sort(
                    (a, b) =>
                        Number(
                            b.overdueDays || 0
                        ) -
                        Number(
                            a.overdueDays || 0
                        )
                );
            }

            return filtered;
        }, [
            monthFilteredLeads,
            searchTerm,
            selectedBa,
            statusFilter
        ]);

    /*
      =========================================
      STATUS LABEL
      =========================================
    */

    const getStatusLabel = (status) => {
        const labels = {
            UPCOMING:
                "Upcoming",

            DUE_TODAY:
                "Due Today",

            OVERDUE:
                "Overdue / Unnoticed",

            VISITED_NOT_CLOSED:
                "Visited - Not Closed",

            DEAL_CLOSED:
                "Deal Closed",

            NOT_INTERESTED:
                "Not Interested",

            VISITED_NOT_INTERESTED:
                "Visited - Not Interested",

            UNSCHEDULED:
                "Unscheduled"
        };

        return (
            labels[status] ||
            status ||
            "-"
        );
    };

    /*
      =========================================
      STATUS CLASS
      =========================================
    */

    const getStatusClass = (status) => {
        if (
            status === "DEAL_CLOSED"
        ) {
            return "lead-status-closed";
        }

        if (
            status ===
            "VISITED_NOT_CLOSED"
        ) {
            return "lead-status-visited";
        }

        if (
            status === "DUE_TODAY"
        ) {
            return "lead-status-today";
        }

        if (
            status === "OVERDUE"
        ) {
            return "lead-status-overdue";
        }

        if (
            status === "UPCOMING"
        ) {
            return "lead-status-upcoming";
        }

        if (
            status ===
            "NOT_INTERESTED" ||
            status ===
            "VISITED_NOT_INTERESTED"
        ) {
            return "lead-status-rejected";
        }

        return "lead-status-default";
    };

    /*
      =========================================
      DATE FORMATTERS
      =========================================
    */

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        const date = new Date(
            `${value}T00:00:00`
        );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
    };

    const formatDateTime = (value) => {
        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    };

    /*
      =========================================
      CLEAR FILTERS
      =========================================
    */

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedBa("ALL");
        setStatusFilter("ALL");
        setSelectedMonth("ALL");
    };

    /*
      =========================================
      UI
      =========================================
    */

    return (
        <div className="admin-lead-page">
            {/* PAGE HEADER */}

            <div className="admin-lead-heading">
                <div>
                    <h1>
                        Lead Management
                    </h1>

                    <p>
                        Track fixed appointments,
                        visits and unattended leads
                        from all BAs.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-lead-refresh-btn"
                    onClick={
                        fetchLeadManagement
                    }
                >
                    Refresh
                </button>
            </div>

            {/* ERROR */}

            {error && (
                <div className="admin-lead-error">
                    {error}
                </div>
            )}

            {/* SUMMARY CARDS */}

            <div className="admin-lead-summary-grid">
                {/* TOTAL */}

                <button
                    type="button"
                    className={`admin-lead-summary-card ${statusFilter === "ALL"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter("ALL")
                    }
                >
                    <span>
                        Total Fixed
                    </span>

                    <strong>
                        {displaySummary.total}
                    </strong>

                    <small>
                        {selectedMonth === "ALL"
                            ? "All appointments"
                            : formatMonthLabel(
                                selectedMonth
                            )}
                    </small>
                </button>

                {/* UPCOMING */}

                <button
                    type="button"
                    className={`admin-lead-summary-card ${statusFilter ===
                            "UPCOMING"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter(
                            "UPCOMING"
                        )
                    }
                >
                    <span>
                        Upcoming
                    </span>

                    <strong>
                        {
                            displaySummary.upcoming
                        }
                    </strong>

                    <small>
                        Future appointments
                    </small>
                </button>

                {/* DUE TODAY */}

                <button
                    type="button"
                    className={`admin-lead-summary-card ${statusFilter ===
                            "DUE_TODAY"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter(
                            "DUE_TODAY"
                        )
                    }
                >
                    <span>
                        Due Today
                    </span>

                    <strong>
                        {
                            displaySummary.dueToday
                        }
                    </strong>

                    <small>
                        Appointments today
                    </small>
                </button>

                {/* OVERDUE */}

                <button
                    type="button"
                    className={`admin-lead-summary-card admin-lead-warning-card ${statusFilter ===
                            "OVERDUE"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter(
                            "OVERDUE"
                        )
                    }
                >
                    <span>
                        Overdue / Unnoticed
                    </span>

                    <strong>
                        {
                            displaySummary.overdue
                        }
                    </strong>

                    <small>
                        Not visited on time
                    </small>
                </button>

                {/* VISITED NOT CLOSED */}

                <button
                    type="button"
                    className={`admin-lead-summary-card ${statusFilter ===
                            "VISITED_NOT_CLOSED"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter(
                            "VISITED_NOT_CLOSED"
                        )
                    }
                >
                    <span>
                        Visited - Not Closed
                    </span>

                    <strong>
                        {
                            displaySummary
                                .visitedNotClosed
                        }
                    </strong>

                    <small>
                        Follow-up required
                    </small>
                </button>

                {/* DEAL CLOSED */}

                <button
                    type="button"
                    className={`admin-lead-summary-card ${statusFilter ===
                            "DEAL_CLOSED"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter(
                            "DEAL_CLOSED"
                        )
                    }
                >
                    <span>
                        Deal Closed
                    </span>

                    <strong>
                        {
                            displaySummary.dealClosed
                        }
                    </strong>

                    <small>
                        ₹
                        {Number(
                            displaySummary
                                .closedRevenue || 0
                        ).toLocaleString(
                            "en-IN"
                        )}{" "}
                        revenue
                    </small>
                </button>

                {/* NOT INTERESTED */}

                <button
                    type="button"
                    className={`admin-lead-summary-card ${statusFilter ===
                            "NOT_INTERESTED"
                            ? "active"
                            : ""
                        }`}
                    onClick={() =>
                        setStatusFilter(
                            "NOT_INTERESTED"
                        )
                    }
                >
                    <span>
                        Not Interested
                    </span>

                    <strong>
                        {
                            displaySummary
                                .notInterested
                        }
                    </strong>

                    <small>
                        Lost / rejected leads
                    </small>
                </button>
            </div>

            {/* FILTERS */}

            <div className="admin-lead-filters">
                {/* SEARCH */}

                <div className="admin-lead-filter-group admin-lead-search">
                    <label>
                        Search
                    </label>

                    <input
                        type="text"
                        placeholder="Search business, contact, BA, status..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                    />
                </div>

                {/* MONTH */}

                <div className="admin-lead-filter-group">
                    <label>
                        Month
                    </label>

                    <select
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(
                                e.target.value
                            );

                            /*
                              Reset status whenever
                              period changes.
                            */
                            setStatusFilter(
                                "ALL"
                            );
                        }}
                    >
                        <option value="ALL">
                            All Time
                        </option>

                        {monthOptions.map(
                            (month) => (
                                <option
                                    key={month}
                                    value={month}
                                >
                                    {formatMonthLabel(
                                        month
                                    )}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* BA */}

                <div className="admin-lead-filter-group">
                    <label>
                        BA
                    </label>

                    <select
                        value={selectedBa}
                        onChange={(e) =>
                            setSelectedBa(
                                e.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            All BAs
                        </option>

                        {baOptions.map(
                            (ba) => (
                                <option
                                    key={ba}
                                    value={ba}
                                >
                                    {ba}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* STATUS */}

                <div className="admin-lead-filter-group">
                    <label>
                        Status
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            All Status
                        </option>

                        <option value="UPCOMING">
                            Upcoming
                        </option>

                        <option value="DUE_TODAY">
                            Due Today
                        </option>

                        <option value="OVERDUE">
                            Overdue / Unnoticed
                        </option>

                        <option value="VISITED_NOT_CLOSED">
                            Visited - Not Closed
                        </option>

                        <option value="DEAL_CLOSED">
                            Deal Closed
                        </option>

                        <option value="NOT_INTERESTED">
                            Not Interested
                        </option>

                        <option value="UNSCHEDULED">
                            Unscheduled
                        </option>
                    </select>
                </div>

                {/* CLEAR */}

                <div className="admin-lead-filter-actions">
                    <button
                        type="button"
                        onClick={
                            clearFilters
                        }
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* RESULTS INFO */}

            <div className="admin-lead-results-bar">
                <div>
                    <strong>
                        {
                            filteredLeads.length
                        }
                    </strong>{" "}
                    leads displayed

                    {" · "}

                    <strong>
                        {selectedMonth === "ALL"
                            ? "All Time"
                            : formatMonthLabel(
                                selectedMonth
                            )}
                    </strong>
                </div>

                {statusFilter !== "ALL" && (
                    <span>
                        Filter:{" "}
                        {getStatusLabel(
                            statusFilter
                        )}
                    </span>
                )}
            </div>

            {/* TABLE */}

            <div className="admin-lead-table-wrapper">
                {loading ? (
                    <div className="admin-lead-loading">
                        Loading lead management
                        data...
                    </div>
                ) : filteredLeads.length ===
                    0 ? (
                    <div className="admin-lead-empty">
                        No appointments found.
                    </div>
                ) : (
                    <table className="admin-lead-table">
                        <thead>
                            <tr>
                                <th>
                                    Sl No
                                </th>

                                <th>
                                    Business
                                </th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    BA
                                </th>

                                <th>
                                    Appointment
                                </th>

                                <th>
                                    Visit
                                </th>

                                <th>
                                    Current Status
                                </th>

                                <th>
                                    Overdue
                                </th>

                                <th>
                                    Closed Date
                                </th>

                                <th>
                                    Revenue
                                </th>

                                <th>
                                    Response / Reason
                                </th>

                                <th>
                                    Last Updated
                                </th>

                                <th>
                                    Map
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredLeads.map(
                                (item, index) => {
                                    const responseText =
                                        item.visitedResponse ||
                                        item
                                            .visitedRejectionReason ||
                                        item.rejectionReason ||
                                        item.response ||
                                        item.notes ||
                                        "-";

                                    return (
                                        <tr
                                            key={item._id}
                                        >
                                            {/* SERIAL */}

                                            <td>
                                                {index + 1}
                                            </td>

                                            {/* BUSINESS */}

                                            <td>
                                                <div className="admin-lead-business-cell">
                                                    <strong>
                                                        {item.businessName ||
                                                            "-"}
                                                    </strong>

                                                    <span>
                                                        Fixed:{" "}
                                                        {formatDate(
                                                            item
                                                                .appointmentFixedDate
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* CONTACT */}

                                            <td>
                                                {item.contact ||
                                                    "-"}
                                            </td>

                                            {/* BA */}

                                            <td>
                                                {item.baName ||
                                                    "-"}
                                            </td>

                                            {/* APPOINTMENT */}

                                            <td>
                                                <div className="admin-lead-date-cell">
                                                    <strong>
                                                        {formatDate(
                                                            item
                                                                .appointmentDate
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {item
                                                            .appointmentTime ||
                                                            "-"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* VISIT */}

                                            <td>
                                                {item
                                                    .isVisitedAppointment ? (
                                                    <div className="admin-lead-visit-cell visited">
                                                        <strong>
                                                            Visited
                                                        </strong>

                                                        <span>
                                                            {formatDate(
                                                                item
                                                                    .visitedDate
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="admin-lead-visit-cell pending">
                                                        <strong>
                                                            Not Visited
                                                        </strong>
                                                    </div>
                                                )}
                                            </td>

                                            {/* STATUS */}

                                            <td>
                                                <span
                                                    className={`admin-lead-status ${getStatusClass(
                                                        item
                                                            .leadStatus
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        item
                                                            .leadStatus
                                                    )}
                                                </span>
                                            </td>

                                            {/* OVERDUE */}

                                            <td>
                                                {item.leadStatus ===
                                                    "OVERDUE" ? (
                                                    <span
                                                        className={`admin-overdue-badge ${item.overduePriority ===
                                                                "CRITICAL"
                                                                ? "critical"
                                                                : item.overduePriority ===
                                                                    "HIGH"
                                                                    ? "high"
                                                                    : "new"
                                                            }`}
                                                    >
                                                        {
                                                            item.overdueDays
                                                        }{" "}
                                                        {item.overdueDays ===
                                                            1
                                                            ? "day"
                                                            : "days"}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            {/* CLOSED DATE */}

                                            <td>
                                                {item
                                                    .hasClosedDeal
                                                    ? formatDate(
                                                        item
                                                            .closedDealDate
                                                    )
                                                    : "-"}
                                            </td>

                                            {/* REVENUE */}

                                            <td>
                                                {item
                                                    .hasClosedDeal ? (
                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            item.revenue ||
                                                            0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </strong>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            {/* RESPONSE */}

                                            <td>
                                                <div className="admin-lead-response-cell">
                                                    {
                                                        responseText
                                                    }
                                                </div>
                                            </td>

                                            {/* LAST UPDATED */}

                                            <td>
                                                {formatDateTime(
                                                    item
                                                        .lastUpdated
                                                )}
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
                                                        className="admin-lead-map-btn"
                                                    >
                                                        Open Map
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminLeadManagement;