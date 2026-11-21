
import { useEffect, useState } from "react";
import api from "../services/api";
import "../css/baTelecallerAppointments.css";

const STATUS_LABELS = {
    PENDING_ASSIGNMENT: "Pending Assignment",
    ASSIGNED: "Pending Visit",
    NOT_VISITED: "Not Visited",
    VISITED: "Visited",
    DEAL_CLOSED: "Deal Closed - Form Pending",
    NOT_INTERESTED: "Not Interested",
    FORM_COMPLETED: "Form Completed"
};

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

    const parts = String(value).split("-");

    return parts.length === 3
        ? `${parts[2]}/${parts[1]}/${parts[0]}`
        : value;
};

const formatTime = (value) => {
    if (!value) return "-";

    const [hourValue, minute = "00"] = String(value).split(":");
    const hour = Number(hourValue);

    if (Number.isNaN(hour)) return value;

    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"
        }`;
};

const getMapLink = (link) => {
    if (!link) return "";

    return /^https?:\/\//i.test(link)
        ? link
        : `https://${link}`;
};

const BaTelecallerAppointmentsPage = () => {
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());

    const [appointments, setAppointments] = useState([]);
    const [visitDates, setVisitDates] = useState({});
    const [visitNotes, setVisitNotes] = useState({});
    const [editingVisitId, setEditingVisitId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState("");
    const [savingNoteId, setSavingNoteId] = useState("");
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAppointments = async () => {
        try {
            setLoading(true);

            const { data } = await api.get(
                "/presentation-details/telecaller-appointments/ba"
            );

            const records = Array.isArray(data) ? data : [];

            setAppointments(records);

            setVisitDates(
                Object.fromEntries(
                    records.map((item) => [
                        item._id,
                        item.visitedDate || today
                    ])
                )
            );

            setVisitNotes(
                Object.fromEntries(
                    records.map((item) => [
                        item._id,
                        item.visitedResponse || ""
                    ])
                )
            );

            setEditingVisitId(null);
            setMessage("");
        } catch (error) {
            setAppointments([]);

            setMessage(
                error.response?.data?.message ||
                "Failed to fetch Telecaller appointments"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const updateVisitStatus = async (appointment, isVisited) => {
        if (
            !["ASSIGNED", "NOT_VISITED", "VISITED"].includes(
                appointment.tcAppointmentStatus
            )
        ) {
            setMessage(
                "This appointment is finalized and cannot be changed."
            );
            return;
        }

        const visitedDate =
            visitDates[appointment._id] || today;

        if (isVisited && !visitedDate) {
            setMessage("Please select the visited date.");
            return;
        }

        if (
            !isVisited &&
            appointment.tcAppointmentStatus === "VISITED" &&
            !window.confirm(
                "Change this visited appointment back to Not Visited?"
            )
        ) {
            return;
        }

        try {
            setUpdatingId(appointment._id);

            const { data } = await api.put(
                `/presentation-details/telecaller-appointments/${appointment._id}/visit-status`,
                {
                    isVisitedAppointment: isVisited,
                    visitedDate: isVisited ? visitedDate : ""
                }
            );

            setAppointments((previous) =>
                previous.map((item) =>
                    item._id === appointment._id
                        ? data.data
                        : item
                )
            );

            setEditingVisitId(null);

            setMessage(
                data.message || "Appointment updated successfully"
            );
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to update appointment"
            );
        } finally {
            setUpdatingId("");
        }
    };

    const handleDealClosed = async (item) => {
        if (item.tcAppointmentStatus !== "VISITED") return;

        if (
            (visitNotes[item._id] || "") !==
            (item.visitedResponse || "")
        ) {
            setMessage(
                "Please save your BA visit notes before closing this deal."
            );
            return;
        }

        const confirmed = window.confirm(
            `Confirm Deal Closed for ${item.businessName || "this business"
            }?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(item._id);

            const { data } = await api.put(
                `/presentation-details/telecaller-appointments/${item._id}/deal-closed`
            );

            setAppointments((previous) =>
                previous.map((record) =>
                    record._id === item._id
                        ? data.data
                        : record
                )
            );

            setEditingVisitId(null);

            setMessage(
                "Deal closed successfully. Returned to the Telecaller for form filling."
            );
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to close deal"
            );
        } finally {
            setUpdatingId("");
        }
    };

    const handleNotInterested = async (item) => {
        if (item.tcAppointmentStatus !== "VISITED") return;

        if (
            (visitNotes[item._id] || "") !==
            (item.visitedResponse || "")
        ) {
            setMessage(
                "Please save your BA visit notes before marking Not Interested."
            );
            return;
        }

        const confirmed = window.confirm(
            `Mark ${item.businessName || "this business"
            } as Not Interested?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(item._id);

            const { data } = await api.put(
                `/presentation-details/telecaller-appointments/${item._id}/not-interested`
            );

            setAppointments((previous) =>
                previous.map((record) =>
                    record._id === item._id
                        ? data.data
                        : record
                )
            );

            setEditingVisitId(null);
            setMessage("Appointment marked as Not Interested");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to update appointment"
            );
        } finally {
            setUpdatingId("");
        }
    };

    const handleEditFinalOutcome = async (item) => {
        if (
            !["DEAL_CLOSED", "NOT_INTERESTED"].includes(
                item.tcAppointmentStatus
            )
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Reopen ${item.businessName || "this appointment"
            } for correction? This will return its status to Visited.`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(item._id);

            const { data } = await api.put(
                `/presentation-details/telecaller-appointments/${item._id}/reopen`
            );

            setAppointments((previous) =>
                previous.map((record) =>
                    record._id === item._id
                        ? data.data
                        : record
                )
            );

            setEditingVisitId(item._id);

            setMessage(
                "Appointment reopened. Correct the details and select the right outcome."
            );
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to reopen appointment"
            );
        } finally {
            setUpdatingId("");
        }
    };

    const saveVisitNote = async (item) => {
        try {
            setSavingNoteId(item._id);

            const { data } = await api.put(
                `/presentation-details/telecaller-appointments/${item._id}/visited-response`,
                {
                    visitedResponse:
                        visitNotes[item._id] || ""
                }
            );

            setAppointments((previous) =>
                previous.map((record) =>
                    record._id === item._id
                        ? {
                            ...record,
                            visitedResponse:
                                data.data.visitedResponse
                        }
                        : record
                )
            );

            setVisitNotes((previous) => ({
                ...previous,
                [item._id]:
                    data.data.visitedResponse || ""
            }));

            setMessage(
                "BA visit notes saved successfully."
            );
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to save visit notes"
            );
        } finally {
            setSavingNoteId("");
        }
    };

    const filteredAppointments = appointments.filter(
        (item) => {
            const search = searchTerm.trim().toLowerCase();

            if (!search) return true;

            return [
                item.businessName,
                item.contact,
                item.mapLink,
                item.appointmentDate,
                item.appointmentTime,
                item.telecallerId?.name,
                item.telecallerCategory,
                item.tcAppointmentStatus,
                item.visitedResponse
            ]
                .map((value) =>
                    String(value || "").toLowerCase()
                )
                .join(" ")
                .includes(search);
        }
    );

    const pendingCount = appointments.filter(
        (item) =>
            item.tcAppointmentStatus === "ASSIGNED"
    ).length;

    const visitedCount = appointments.filter(
        (item) =>
            item.tcAppointmentStatus === "VISITED"
    ).length;

    const notVisitedCount = appointments.filter(
        (item) =>
            item.tcAppointmentStatus === "NOT_VISITED"
    ).length;

    return (
        <div className="ba-tc-page">
            <div className="ba-tc-card">
                <div className="ba-tc-header">
                    <div>
                        <h2>Appointments by Telecaller</h2>
                        <p>
                            Appointments fixed by Telecallers
                            and assigned to you by Admin.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={fetchAppointments}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>

                {message && (
                    <p className="ba-tc-message">
                        {message}
                    </p>
                )}

                <div className="ba-tc-summary-grid">
                    <div className="ba-tc-summary-card">
                        <span>Total Assigned</span>
                        <strong>{appointments.length}</strong>
                    </div>

                    <div className="ba-tc-summary-card">
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>

                    <div className="ba-tc-summary-card">
                        <span>Visited</span>
                        <strong>{visitedCount}</strong>
                    </div>

                    <div className="ba-tc-summary-card">
                        <span>Not Visited</span>
                        <strong>{notVisitedCount}</strong>
                    </div>
                </div>

                <div className="ba-tc-search">
                    <label htmlFor="ba-tc-search-input">
                        Search
                    </label>

                    <input
                        id="ba-tc-search-input"
                        type="text"
                        value={searchTerm}
                        placeholder="Search business, contact, Telecaller..."
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />
                </div>

                {loading ? (
                    <div className="ba-tc-empty">
                        Loading assigned appointments...
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="ba-tc-empty">
                        No Telecaller appointments assigned to you.
                    </div>
                ) : (
                    <div className="ba-tc-table-wrap">
                        <table className="ba-tc-table">
                            <thead>
                                <tr>
                                    <th>Business</th>
                                    <th>Contact</th>
                                    <th>Map</th>
                                    <th>Appointment</th>
                                    <th>Telecaller</th>
                                    <th>Category</th>
                                    <th>Visit Date</th>
                                    <th>BA Visit Notes</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAppointments.map((item) => {
                                    const status =
                                        item.tcAppointmentStatus;

                                    const isEditing =
                                        editingVisitId === item._id;

                                    const busy =
                                        updatingId === item._id ||
                                        savingNoteId === item._id;

                                    const canEditDate =
                                        status === "ASSIGNED" ||
                                        isEditing;

                                    const hasChangedNote =
                                        (visitNotes[item._id] || "") !==
                                        (item.visitedResponse || "");

                                    return (
                                        <tr key={item._id}>
                                            <td>
                                                <strong>
                                                    {item.businessName || "-"}
                                                </strong>
                                            </td>

                                            <td>
                                                {item.contact || "-"}
                                            </td>

                                            <td>
                                                {item.mapLink ? (
                                                    <a
                                                        href={getMapLink(item.mapLink)}
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
                                                <div className="ba-tc-date">
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
                                                <div className="ba-tc-person">
                                                    <strong>
                                                        {item.telecallerId?.name ||
                                                            "-"}
                                                    </strong>
                                                    <small>Telecaller</small>
                                                </div>
                                            </td>

                                            <td>
                                                {getCategoryLabel(
                                                    item.telecallerCategory
                                                )}
                                            </td>

                                            <td>
                                                {canEditDate ? (
                                                    <input
                                                        type="date"
                                                        className="ba-tc-date-input"
                                                        value={
                                                            visitDates[item._id] || ""
                                                        }
                                                        onChange={(event) =>
                                                            setVisitDates((previous) => ({
                                                                ...previous,
                                                                [item._id]:
                                                                    event.target.value
                                                            }))
                                                        }
                                                        disabled={busy}
                                                    />
                                                ) : (
                                                    formatDate(item.visitedDate)
                                                )}
                                            </td>

                                            <td>
                                                {item.assignmentStatus ===
                                                    "ASSIGNED" ? (
                                                    <div className="ba-tc-note-editor">
                                                        <textarea
                                                            className="ba-tc-note-input"
                                                            rows={2}
                                                            maxLength={1500}
                                                            placeholder="Add BA visit notes..."
                                                            value={
                                                                visitNotes[item._id] || ""
                                                            }
                                                            onChange={(event) =>
                                                                setVisitNotes(
                                                                    (previous) => ({
                                                                        ...previous,
                                                                        [item._id]:
                                                                            event.target.value
                                                                    })
                                                                )
                                                            }
                                                            disabled={busy}
                                                        />

                                                        <button
                                                            type="button"
                                                            className="ba-tc-note-save-btn"
                                                            disabled={
                                                                busy || !hasChangedNote
                                                            }
                                                            onClick={() =>
                                                                saveVisitNote(item)
                                                            }
                                                        >
                                                            {savingNoteId === item._id
                                                                ? "Saving..."
                                                                : "Save Note"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`ba-tc-final-status ${status === "DEAL_CLOSED" ||
                                                            status === "FORM_COMPLETED"
                                                            ? "deal"
                                                            : status === "NOT_INTERESTED"
                                                                ? "rejected"
                                                                : status === "VISITED"
                                                                    ? "visited"
                                                                    : status === "NOT_VISITED"
                                                                        ? "not-visited"
                                                                        : "pending"
                                                        }`}
                                                >
                                                    {STATUS_LABELS[status] ||
                                                        status ||
                                                        "-"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="ba-tc-actions">
                                                    {status === "ASSIGNED" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="ba-tc-visited-btn"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    updateVisitStatus(
                                                                        item,
                                                                        true
                                                                    )
                                                                }
                                                            >
                                                                Visited
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="ba-tc-not-visited-btn"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    updateVisitStatus(
                                                                        item,
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                Not Visited
                                                            </button>
                                                        </>
                                                    )}

                                                    {status === "VISITED" &&
                                                        !isEditing && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="ba-tc-deal-btn"
                                                                    disabled={busy}
                                                                    onClick={() =>
                                                                        handleDealClosed(item)
                                                                    }
                                                                >
                                                                    Deal Closed
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="ba-tc-not-interested-btn"
                                                                    disabled={busy}
                                                                    onClick={() =>
                                                                        handleNotInterested(item)
                                                                    }
                                                                >
                                                                    Not Interested
                                                                </button>
                                                            </>
                                                        )}

                                                    {(status === "VISITED" ||
                                                        status === "NOT_VISITED") &&
                                                        (isEditing ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="ba-tc-visited-btn"
                                                                    disabled={busy}
                                                                    onClick={() =>
                                                                        updateVisitStatus(
                                                                            item,
                                                                            true
                                                                        )
                                                                    }
                                                                >
                                                                    {status === "VISITED"
                                                                        ? "Save Visit"
                                                                        : "Visited"}
                                                                </button>

                                                                {status === "VISITED" && (
                                                                    <button
                                                                        type="button"
                                                                        className="ba-tc-not-visited-btn"
                                                                        disabled={busy}
                                                                        onClick={() =>
                                                                            updateVisitStatus(
                                                                                item,
                                                                                false
                                                                            )
                                                                        }
                                                                    >
                                                                        Not Visited
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    className="ba-tc-cancel-btn"
                                                                    disabled={busy}
                                                                    onClick={() => {
                                                                        setVisitDates(
                                                                            (previous) => ({
                                                                                ...previous,
                                                                                [item._id]:
                                                                                    item.visitedDate ||
                                                                                    today
                                                                            })
                                                                        );

                                                                        setEditingVisitId(null);
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="ba-tc-edit-btn"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    setEditingVisitId(item._id)
                                                                }
                                                            >
                                                                Edit Visit
                                                            </button>
                                                        ))}

                                                    {(status === "DEAL_CLOSED" ||
                                                        status === "NOT_INTERESTED") && (
                                                            <button
                                                                type="button"
                                                                className="ba-tc-edit-btn"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    handleEditFinalOutcome(item)
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                        )}

                                                    {status === "FORM_COMPLETED" && (
                                                        <span className="ba-tc-action-locked">
                                                            Form Completed - Status Locked
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BaTelecallerAppointmentsPage;
