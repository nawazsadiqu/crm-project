
import PresentationDetail from "../models/PresentationDetail.js";
import TmcLog from "../models/TmcLog.js";

// Get current date in IST
const getTodayIST = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const date = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );

    return `${date.year}-${date.month}-${date.day}`;
};

// Build regular appointment or callback reminder
const buildReminderItem = (item, type) => ({
    reminderId: `${type}-${item._id}`,
    id: item._id,
    type,

    date: item.date || "",
    appointmentDate: item.appointmentDate || "",
    appointmentTime: item.appointmentTime || "",
    callbackDate: item.callbackDate || "",
    callbackTime: item.callbackTime || "",

    presentationNumber: item.presentationNumber ?? "",
    status: item.status || "",
    businessName: item.businessName || "",
    mapLink: item.mapLink || "",
    contact: item.contact || "",
    notes: item.notes || "",
    response: item.response || ""
});

// Extract business information from TMC call notes
const getNoteValue = (notes, label) => {
    const normalizedLabel = String(label)
        .trim()
        .toLowerCase();

    const line = String(notes || "")
        .split("\n")
        .find((row) =>
            row.trim().toLowerCase().startsWith(normalizedLabel)
        );

    return line
        ? line.split(":").slice(1).join(":").trim()
        : "";
};

// Build CBP reminder
const buildCallbackPresentationReminder = (log, call) => ({
    reminderId:
        `callback-presentation-${log._id}-${call.callNumber}`,

    id: `${log._id}-${call.callNumber}`,
    logId: log._id,
    type: "callback-presentation",

    date: log.date || "",
    appointmentDate: "",
    callbackDate: call.callbackDate || "",
    callbackTime: call.callbackTime || "",

    presentationNumber: "",
    callNumber: call.callNumber ?? "",
    status: "CBP",

    businessName: getNoteValue(call.notes, "Business Name"),
    mapLink: getNoteValue(call.notes, "Map Link"),
    contact: getNoteValue(call.notes, "Contact Number"),

    notes: call.notes || "",
    response: "Call Back for Presentation"
});

// ============================================
// GET TODAY'S TELECALLER REMINDERS
// ============================================

export const getTelecallerTodayReminders = async (req, res) => {
    try {
        if (req.user?.role !== "telecaller") {
            return res.status(403).json({
                success: false,
                message: "Telecaller access only"
            });
        }

        const userId = req.user.id;
        const today = getTodayIST();

        // 1. Today's appointments fixed by this Telecaller
        const appointments = await PresentationDetail.find({
            fixedByRole: "telecaller",
            telecallerId: userId,
            status: "Appointment Fixed",
            appointmentDate: today,

            // Do not remind for completed/handled appointments
            tcAppointmentStatus: {
                $nin: [
                    "VISITED",
                    "NOT_VISITED",
                    "DEAL_CLOSED",
                    "FORM_COMPLETED"
                ]
            }
        })
            .sort({ appointmentTime: 1, createdAt: -1 })
            .lean();

        // 2. Today's callback appointments (CBA / CBC)
        const callbackAppointments =
            await PresentationDetail.find({
                userId,
                status: { $in: ["CBA", "CBC"] },
                callbackDate: today
            })
                .sort({ callbackTime: 1, createdAt: -1 })
                .lean();

        // 3. Today's callback presentations from TMC
        const callbackPresentationLogs = await TmcLog.find({
            userId,
            calls: {
                $elemMatch: {
                    status: "CBP",
                    callbackDate: today
                }
            }
        })
            .sort({ date: -1, createdAt: -1 })
            .lean();

        const callbackPresentations = [];

        for (const log of callbackPresentationLogs) {
            const calls = Array.isArray(log.calls)
                ? log.calls
                : [];

            for (const call of calls) {
                if (
                    call.status === "CBP" &&
                    call.callbackDate === today
                ) {
                    callbackPresentations.push(
                        buildCallbackPresentationReminder(log, call)
                    );
                }
            }
        }

        callbackPresentations.sort(
            (a, b) =>
                String(a.callbackTime || "").localeCompare(
                    String(b.callbackTime || "")
                ) ||
                Number(a.callNumber || 0) -
                Number(b.callNumber || 0)
        );

        const appointmentReminders = appointments.map((item) =>
            buildReminderItem(item, "appointment")
        );

        const callbackAppointmentReminders =
            callbackAppointments.map((item) =>
                buildReminderItem(item, "callback")
            );

        return res.status(200).json({
            success: true,
            date: today,

            total:
                appointmentReminders.length +
                callbackAppointmentReminders.length +
                callbackPresentations.length,

            appointments: appointmentReminders,
            callbackAppointments: callbackAppointmentReminders,
            callbackPresentations
        });
    } catch (error) {
        console.error(
            "getTelecallerTodayReminders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch Telecaller reminders"
        });
    }
};
