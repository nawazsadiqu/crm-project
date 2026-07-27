import PresentationDetail from "../models/PresentationDetail.js";
import TmcLog from "../models/TmcLog.js";

const getTodayIST = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
};

const buildReminderItem = (item, type) => {
  return {
    reminderId: `${type}-${item._id}`,
    id: item._id,
    type,

    date: item.date || "",
    appointmentDate: item.appointmentDate || "",
    callbackDate: item.callbackDate || "",

    presentationNumber: item.presentationNumber ?? "",
    status: item.status || "",

    businessName: item.businessName || "",
    mapLink: item.mapLink || "",
    contact: item.contact || "",

    notes: item.notes || "",
    response: item.response || ""
  };
};

const getNoteValue = (notes, label) => {
  const normalizedLabel = String(label || "")
    .trim()
    .toLowerCase();

  const line = String(notes || "")
    .split("\n")
    .find((row) =>
      row
        .trim()
        .toLowerCase()
        .startsWith(normalizedLabel)
    );

  if (!line) {
    return "";
  }

  return line
    .split(":")
    .slice(1)
    .join(":")
    .trim();
};

const buildCallbackPresentationReminder = (log, call) => {
  return {
    reminderId: `callback-presentation-${log._id}-${call.callNumber}`,

    id: `${log._id}-${call.callNumber}`,
    logId: log._id,

    type: "callback-presentation",

    date: log.date || "",
    appointmentDate: "",
    callbackDate: call.callbackDate || "",

    presentationNumber: "",
    callNumber: call.callNumber ?? "",

    status: "CBP",

    businessName: getNoteValue(
      call.notes,
      "Business Name"
    ),

    mapLink: getNoteValue(
      call.notes,
      "Map Link"
    ),

    contact: getNoteValue(
      call.notes,
      "Contact Number"
    ),

    notes: call.notes || "",
    response: "Call Back for Presentation"
  };
};

export const getTodayBaReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayIST();

    /*
      1. Appointments whose appointment date is today
    */
    const appointments = await PresentationDetail.find({
      userId,
      status: "Appointment Fixed",
      appointmentDate: today
    })
      .sort({
        appointmentDate: 1,
        createdAt: -1
      })
      .lean();

    /*
      2. Callback appointments whose callback date is today
    */
    const callbackAppointments =
      await PresentationDetail.find({
        userId,
        status: {
          $in: ["CBA", "CBC"]
        },
        callbackDate: today
      })
        .sort({
          callbackDate: 1,
          createdAt: -1
        })
        .lean();

    /*
      3. TMC logs containing CBP calls whose callback date is today
    */
    const callbackPresentationLogs =
      await TmcLog.find({
        userId,

        calls: {
          $elemMatch: {
            status: "CBP",
            callbackDate: today
          }
        }
      })
        .sort({
          date: -1,
          createdAt: -1
        })
        .lean();

    /*
      A single TMC log may contain multiple CBP calls.
      Extract only the calls whose callback date is today.
    */
    const callbackPresentations = [];

    callbackPresentationLogs.forEach((log) => {
      const calls = Array.isArray(log.calls)
        ? log.calls
        : [];

      calls
        .filter(
          (call) =>
            call.status === "CBP" &&
            call.callbackDate === today
        )
        .forEach((call) => {
          callbackPresentations.push(
            buildCallbackPresentationReminder(
              log,
              call
            )
          );
        });
    });

    callbackPresentations.sort((a, b) => {
      return (
        Number(a.callNumber || 0) -
        Number(b.callNumber || 0)
      );
    });

    const appointmentReminders = appointments.map(
      (item) =>
        buildReminderItem(
          item,
          "appointment"
        )
    );

    const callbackAppointmentReminders =
      callbackAppointments.map((item) =>
        buildReminderItem(
          item,
          "callback"
        )
      );

    res.status(200).json({
      success: true,
      date: today,

      total:
        appointmentReminders.length +
        callbackAppointmentReminders.length +
        callbackPresentations.length,

      appointments: appointmentReminders,

      callbackAppointments:
        callbackAppointmentReminders,

      callbackPresentations
    });
  } catch (error) {
    console.error(
      "getTodayBaReminders error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch BA reminders"
    });
  }
};