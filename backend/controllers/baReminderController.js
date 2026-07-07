import PresentationDetail from "../models/PresentationDetail.js";

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

export const getTodayBaReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayIST();

    const appointments = await PresentationDetail.find({
      userId,
      status: "Appointment Fixed",
      appointmentDate: today
    })
      .sort({ appointmentDate: 1, createdAt: -1 })
      .lean();

    const callbackAppointments = await PresentationDetail.find({
      userId,
      status: { $in: ["CBA", "CBC"] },
      callbackDate: today
    })
      .sort({ callbackDate: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      date: today,
      total: appointments.length + callbackAppointments.length,
      appointments: appointments.map((item) =>
        buildReminderItem(item, "appointment")
      ),
      callbackAppointments: callbackAppointments.map((item) =>
        buildReminderItem(item, "callback")
      )
    });
  } catch (error) {
    console.error("getTodayBaReminders error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};