import {
    useEffect,
    useState
} from "react";

import api from "../services/api";
import "../css/adminTelecallerAppointments.css";

const AdminTelecallerAppointmentsPage = () => {
    const [appointments, setAppointments] =
        useState([]);

    const [baUsers, setBaUsers] =
        useState([]);

    const [baSelections, setBaSelections] =
        useState({});

    const [loading, setLoading] =
        useState(true);

    const [message, setMessage] =
        useState("");

    const [assigningId, setAssigningId] =
        useState("");

    const getCategoryLabel = (category) => {
        switch (category) {
            case "GBP":
                return "Google Business Profile";

            case "WEBSITE":
                return "Website";

            case "WHATSAPP_BROADCAST":
                return "WhatsApp Broadcast Manager";

            default:
                return category || "-";
        }
    };

    const formatDate = (value) => {
        if (!value) return "-";

        const parts =
            String(value).split("-");

        if (parts.length !== 3) {
            return value;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const formatTime = (value) => {
        if (!value) return "-";

        const [hourValue, minute] =
            value.split(":");

        let hour = Number(hourValue);

        if (
            Number.isNaN(hour)
        ) {
            return value;
        }

        const period =
            hour >= 12 ? "PM" : "AM";

        hour = hour % 12 || 12;

        return `${hour}:${minute || "00"
            } ${period}`;
    };

    const getMapLink = (link) => {
        if (!link) return "";

        return link.startsWith("http")
            ? link
            : `https://${link}`;
    };

    const fetchBaUsers = async () => {
        try {
            const { data } =
                await api.get(
                    "/admin/calling-users"
                );

            const users =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.users)
                        ? data.users
                        : [];

            const activeBas =
                users.filter((user) => {
                    const role =
                        String(
                            user.role || ""
                        )
                            .trim()
                            .toLowerCase();

                    return (
                        user.isActive === true &&
                        role === "ba"
                    );
                });

            setBaUsers(activeBas);
        } catch (error) {
            console.error(
                "Failed to fetch BA users:",
                error
            );
        }
    };

    const fetchAppointments =
        async () => {
            try {
                setLoading(true);

                const { data } =
                    await api.get(
                        "/presentation-details/telecaller-appointments/admin"
                    );

                const records =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data.data)
                            ? data.data
                            : [];

                setAppointments(records);

                /*
                  Preselect BA when an appointment
                  is already assigned.
                */
                const selections = {};

                records.forEach((item) => {
                    if (
                        item.assignedBaId?._id
                    ) {
                        selections[item._id] =
                            item.assignedBaId._id;
                    } else if (
                        typeof item.assignedBaId ===
                        "string"
                    ) {
                        selections[item._id] =
                            item.assignedBaId;
                    }
                });

                setBaSelections(selections);

                setMessage("");
            } catch (error) {
                setAppointments([]);

                setMessage(
                    error.response?.data
                        ?.message ||
                    "Failed to fetch Telecaller appointments"
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchBaUsers();
        fetchAppointments();
    }, []);

    const handleBaChange = (
        appointmentId,
        baId
    ) => {
        setBaSelections((previous) => ({
            ...previous,
            [appointmentId]: baId
        }));
    };

    const handleAssignBa =
        async (appointment) => {
            const assignedBaId =
                baSelections[
                appointment._id
                ];

            if (!assignedBaId) {
                setMessage(
                    "Please select a BA before assigning"
                );

                return;
            }

            try {
                setAssigningId(
                    appointment._id
                );

                setMessage("");

                const { data } =
                    await api.put(
                        `/presentation-details/telecaller-appointments/${appointment._id}/assign-ba`,
                        {
                            assignedBaId
                        }
                    );

                setMessage(
                    data.message ||
                    "BA assigned successfully"
                );

                await fetchAppointments();
            } catch (error) {
                setMessage(
                    error.response?.data
                        ?.message ||
                    "Failed to assign BA"
                );
            } finally {
                setAssigningId("");
            }
        };

    const pendingCount =
        appointments.filter(
            (item) =>
                item.assignmentStatus ===
                "UNASSIGNED"
        ).length;

    const assignedCount =
        appointments.filter(
            (item) =>
                item.assignmentStatus ===
                "ASSIGNED"
        ).length;

    return (
        <div className="admin-tc-page">
            <div className="admin-tc-header">
                <div>
                    <h2>
                        Telecaller Appointments
                    </h2>

                    <p>
                        Review appointments fixed
                        by Telecallers and assign
                        them to active BAs.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-tc-refresh-btn"
                    onClick={() => {
                        fetchBaUsers();
                        fetchAppointments();
                    }}
                >
                    Refresh
                </button>
            </div>

            {message && (
                <div className="admin-tc-message">
                    {message}
                </div>
            )}

            <div className="admin-tc-summary-grid">
                <div className="admin-tc-summary-card">
                    <span>
                        Total Appointments
                    </span>

                    <strong>
                        {appointments.length}
                    </strong>
                </div>

                <div className="admin-tc-summary-card">
                    <span>
                        Pending Assignment
                    </span>

                    <strong>
                        {pendingCount}
                    </strong>
                </div>

                <div className="admin-tc-summary-card">
                    <span>
                        Assigned
                    </span>

                    <strong>
                        {assignedCount}
                    </strong>
                </div>
            </div>

            {loading ? (
                <div className="admin-tc-empty">
                    Loading Telecaller
                    appointments...
                </div>
            ) : appointments.length ===
                0 ? (
                <div className="admin-tc-empty">
                    No Telecaller appointments
                    found.
                </div>
            ) : (
                <div className="admin-tc-table-wrap">
                    <table className="admin-tc-table">
                        <thead>
                            <tr>
                                <th>Business</th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    Map
                                </th>

                                <th>
                                    Appointment
                                </th>

                                <th>
                                    Telecaller
                                </th>

                                <th>
                                    Category
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Assign BA
                                </th>

                                <th>
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {appointments.map(
                                (item) => {
                                    const telecaller =
                                        item.telecallerId;

                                    const assignedBa =
                                        item.assignedBaId;

                                    return (
                                        <tr
                                            key={
                                                item._id
                                            }
                                        >
                                            <td>
                                                <div className="admin-tc-business">
                                                    <strong>
                                                        {item.businessName ||
                                                            "-"}
                                                    </strong>

                                                    <small>
                                                        Fixed on{" "}
                                                        {formatDate(
                                                            item.date
                                                        )}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                {item.contact ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {item.mapLink ? (
                                                    <a
                                                        href={getMapLink(
                                                            item.mapLink
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-tc-map-link"
                                                    >
                                                        Open Map
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                <div className="admin-tc-appointment-time">
                                                    <strong>
                                                        {formatDate(
                                                            item.appointmentDate
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {formatTime(
                                                            item.appointmentTime
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="admin-tc-person">
                                                    <strong>
                                                        {telecaller?.name ||
                                                            "-"}
                                                    </strong>

                                                    <small>
                                                        Telecaller
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="admin-tc-category">
                                                    {getCategoryLabel(
                                                        item.telecallerCategory
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-tc-status ${item.assignmentStatus ===
                                                        "ASSIGNED"
                                                        ? "assigned"
                                                        : "pending"
                                                        }`}
                                                >
                                                    {item.assignmentStatus ===
                                                        "ASSIGNED"
                                                        ? "Assigned"
                                                        : "Pending"}
                                                </span>

                                                {assignedBa?.name && (
                                                    <small className="admin-tc-current-ba">
                                                        BA:{" "}
                                                        {
                                                            assignedBa.name
                                                        }
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                <select
                                                    className="admin-tc-ba-select"
                                                    value={
                                                        baSelections[
                                                        item._id
                                                        ] || ""
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleBaChange(
                                                            item._id,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select BA
                                                    </option>

                                                    {baUsers.map(
                                                        (ba) => (
                                                            <option
                                                                key={
                                                                    ba._id
                                                                }
                                                                value={
                                                                    ba._id
                                                                }
                                                            >
                                                                {ba.name}
                                                                {ba.employeeId
                                                                    ? ` - ${ba.employeeId}`
                                                                    : ""}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="admin-tc-assign-btn"
                                                    disabled={
                                                        assigningId ===
                                                        item._id
                                                    }
                                                    onClick={() =>
                                                        handleAssignBa(
                                                            item
                                                        )
                                                    }
                                                >
                                                    {assigningId ===
                                                        item._id
                                                        ? "Assigning..."
                                                        : item.assignmentStatus ===
                                                            "ASSIGNED"
                                                            ? "Reassign"
                                                            : "Assign BA"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminTelecallerAppointmentsPage;