import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";

const getTodayIST = () => {
    const parts = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).formatToParts(new Date());

    const year = parts.find(
        (part) => part.type === "year"
    )?.value;

    const month = parts.find(
        (part) => part.type === "month"
    )?.value;

    const day = parts.find(
        (part) => part.type === "day"
    )?.value;

    return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
    if (
        !value ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
};

const getOverdueDays = (
    appointmentDate,
    today
) => {
    const appointment =
        parseDateOnly(appointmentDate);

    const current =
        parseDateOnly(today);

    if (!appointment || !current) {
        return 0;
    }

    const difference =
        current.getTime() -
        appointment.getTime();

    const days = Math.floor(
        difference /
        (1000 * 60 * 60 * 24)
    );

    return days > 0 ? days : 0;
};

const getOverduePriority = (
    overdueDays
) => {
    if (overdueDays >= 7) {
        return "CRITICAL";
    }

    if (overdueDays >= 3) {
        return "HIGH";
    }

    if (overdueDays >= 1) {
        return "NEW";
    }

    return "";
};

const getLeadStatus = (
    appointment,
    linkedForm,
    today
) => {
    /*
      A linked root FormDetail means
      this appointment became a deal.
    */
    if (linkedForm) {
        return "DEAL_CLOSED";
    }

    /*
      Visited but later marked
      Not Interested.
    */
    if (
        appointment.isVisitedAppointment &&
        appointment.isVisitedNotInterested
    ) {
        return "VISITED_NOT_INTERESTED";
    }

    /*
      Appointment rejected before visit.
    */
    if (
        appointment.status === "Rejected" &&
        appointment.rejectedFromAppointment
    ) {
        return "NOT_INTERESTED";
    }

    /*
      Visited successfully but there is
      still no connected FormDetail.
    */
    if (appointment.isVisitedAppointment) {
        return "VISITED_NOT_CLOSED";
    }

    const appointmentDate =
        appointment.appointmentDate || "";

    if (!appointmentDate) {
        return "UNSCHEDULED";
    }

    if (appointmentDate < today) {
        return "OVERDUE";
    }

    if (appointmentDate === today) {
        return "DUE_TODAY";
    }

    return "UPCOMING";
};

export const getAdminLeadManagement = async (
    req,
    res
) => {
    try {
        const today = getTodayIST();

        /*
          Get all appointment lifecycle records.
        */
        const appointments =
            await PresentationDetail.find({
                $or: [
                    {
                        status: "Appointment Fixed"
                    },
                    {
                        rejectedFromAppointment: true
                    },
                    {
                        isVisitedAppointment: true
                    }
                ]
            })
                .populate(
                    "userId",
                    "name email role"
                )
                .sort({
                    appointmentDate: -1,
                    createdAt: -1
                })
                .lean();

        const appointmentIds =
            appointments.map(
                (appointment) =>
                    appointment._id
            );

        /*
          Get all CLOSED DEAL forms connected
          to these appointments.
    
          Only the root form counts as the
          actual closed deal.
        */
        const linkedForms =
            await FormDetail.find({
                sourcePresentationId: {
                    $in: appointmentIds
                },

                $or: [
                    {
                        parentFormId: null
                    },
                    {
                        parentFormId: {
                            $exists: false
                        }
                    }
                ]
            })
                .select(
                    [
                        "_id",
                        "sourcePresentationId",
                        "businessName",
                        "date",
                        "revenue",
                        "exGst",
                        "profitSharing",
                        "paymentType",
                        "packageAmount",
                        "amountReceivedNow",
                        "totalReceivedAmount",
                        "balanceAmount",
                        "paymentStatus"
                    ].join(" ")
                )
                .lean();

        /*
          Appointment ID -> FormDetail
        */
        const linkedFormMap = new Map();

        linkedForms.forEach((form) => {
            if (form.sourcePresentationId) {
                linkedFormMap.set(
                    String(
                        form.sourcePresentationId
                    ),
                    form
                );
            }
        });

        const leads = appointments.map(
            (appointment) => {
                const linkedForm =
                    linkedFormMap.get(
                        String(appointment._id)
                    ) || null;

                const leadStatus =
                    getLeadStatus(
                        appointment,
                        linkedForm,
                        today
                    );

                const overdueDays =
                    leadStatus === "OVERDUE"
                        ? getOverdueDays(
                            appointment.appointmentDate,
                            today
                        )
                        : 0;

                const overduePriority =
                    getOverduePriority(
                        overdueDays
                    );

                return {
                    _id: appointment._id,

                    baId:
                        appointment.userId?._id ||
                        null,

                    baName:
                        appointment.userId?.name ||
                        "",

                    baEmail:
                        appointment.userId?.email ||
                        "",

                    businessName:
                        appointment.businessName ||
                        "",

                    contact:
                        appointment.contact || "",

                    mapLink:
                        appointment.mapLink || "",

                    appointmentFixedDate:
                        appointment.date || "",

                    appointmentDate:
                        appointment.appointmentDate ||
                        "",

                    appointmentTime:
                        appointment.appointmentTime ||
                        "",

                    status:
                        appointment.status || "",

                    leadStatus,

                    overdueDays,
                    overduePriority,

                    /*
                      VISIT DETAILS
                    */
                    isVisitedAppointment:
                        Boolean(
                            appointment
                                .isVisitedAppointment
                        ),

                    visitedDate:
                        appointment.visitedDate ||
                        "",

                    visitedResponse:
                        appointment.visitedResponse ||
                        "",

                    /*
                      NOT INTERESTED DETAILS
                    */
                    isVisitedNotInterested:
                        Boolean(
                            appointment
                                .isVisitedNotInterested
                        ),

                    visitedRejectionReason:
                        appointment
                            .visitedRejectionReason ||
                        "",

                    rejectedFromAppointment:
                        Boolean(
                            appointment
                                .rejectedFromAppointment
                        ),

                    rejectionReason:
                        appointment.rejectionReason ||
                        "",

                    /*
                      CLOSED DEAL DETAILS
                    */
                    hasClosedDeal:
                        Boolean(linkedForm),

                    closedDealId:
                        linkedForm?._id || null,

                    closedDealDate:
                        linkedForm?.date || "",

                    revenue:
                        linkedForm?.revenue || 0,

                    exGst:
                        linkedForm?.exGst || 0,

                    profitSharing:
                        linkedForm?.profitSharing ||
                        0,

                    paymentType:
                        linkedForm?.paymentType ||
                        "",

                    packageAmount:
                        linkedForm?.packageAmount ||
                        0,

                    amountReceivedNow:
                        linkedForm
                            ?.amountReceivedNow || 0,

                    totalReceivedAmount:
                        linkedForm
                            ?.totalReceivedAmount || 0,

                    balanceAmount:
                        linkedForm?.balanceAmount ||
                        0,

                    paymentStatus:
                        linkedForm?.paymentStatus ||
                        "",

                    notes:
                        appointment.notes || "",

                    response:
                        appointment.response || "",

                    lastUpdated:
                        appointment
                            .presentationUpdatedAt ||
                        appointment.updatedAt ||
                        appointment.createdAt,

                    createdAt:
                        appointment.createdAt
                };
            }
        );

        /*
          --------------------------------
          SUMMARY
          --------------------------------
        */

        const countStatus = (status) =>
            leads.filter(
                (item) =>
                    item.leadStatus === status
            ).length;

        const dealClosed =
            countStatus("DEAL_CLOSED");

        const visitedNotClosed =
            countStatus(
                "VISITED_NOT_CLOSED"
            );

        const visitedNotInterested =
            countStatus(
                "VISITED_NOT_INTERESTED"
            );

        const notInterested =
            countStatus(
                "NOT_INTERESTED"
            ) + visitedNotInterested;

        const summary = {
            total: leads.length,

            upcoming:
                countStatus("UPCOMING"),

            dueToday:
                countStatus("DUE_TODAY"),

            overdue:
                countStatus("OVERDUE"),

            /*
              Keep this temporarily so the
              existing frontend doesn't break
              before we update it.
            */
            visited:
                dealClosed +
                visitedNotClosed,

            visitedNotClosed,

            dealClosed,

            notInterested,

            unscheduled:
                countStatus("UNSCHEDULED"),

            /*
              Useful business figure:
              revenue from appointments that
              became linked closed deals.
            */
            closedRevenue:
                leads.reduce(
                    (total, item) =>
                        item.hasClosedDeal
                            ? total +
                            Number(
                                item.revenue || 0
                            )
                            : total,
                    0
                )
        };

        res.status(200).json({
            success: true,
            today,
            summary,
            leads
        });
    } catch (error) {
        console.error(
            "Admin lead management error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch lead management data"
        });
    }
};