import mongoose from "mongoose";

const presentationDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fixedByRole: {
      type: String,
      enum: ["", "ba", "telecaller"],
      default: ""
    },

    telecallerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    telecallerCategory: {
      type: String,
      enum: [
        "GBP",
        "WEBSITE",
        "WHATSAPP_BROADCAST"
      ],
      default: null
    },

    assignedBaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    assignedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    assignedAt: {
      type: Date,
      default: null
    },

    assignmentStatus: {
      type: String,
      enum: [
        "",
        "UNASSIGNED",
        "ASSIGNED"
      ],
      default: ""
    },

    tcAppointmentStatus: {
      type: String,
      enum: [
        "",
        "PENDING_ASSIGNMENT",
        "ASSIGNED",
        "VISITED",
        "NOT_VISITED",
        "NOT_INTERESTED",
        "DEAL_CLOSED",
        "FORM_COMPLETED"
      ],
      default: ""
    },

    date: {
      type: String,
      required: true
    },

    presentationNumber: {
      type: Number,
      default: null
    },

    businessName: {
      type: String,
      default: "",
      trim: true
    },

    mapLink: {
      type: String,
      default: "",
      trim: true
    },

    contact: {
      type: String,
      default: "",
      trim: true
    },

    response: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      enum: ["Appointment Fixed", "Rejected", "CBC", "CBA", ""],
      default: ""
    },

    appointmentDate: {
      type: String,
      default: ""
    },

    appointmentTime: {
      type: String,
      default: ""
    },

    callbackDate: {
      type: String,
      default: ""
    },

    callbackTime: {
      type: String,
      default: ""
    },

    isCallbackNotInterested: {
      type: Boolean,
      default: false
    },

    callbackRejectionReason: {
      type: String,
      enum: ["", "Not Interested"],
      default: ""
    },

    callbackRejectedAt: {
      type: Date,
      default: null
    },

    notes: {
      type: String,
      default: "",
      trim: true
    },

    visitedResponse: {
      type: String,
      default: ""
    },

    isAppointment: {
      type: Boolean,
      default: false
    },

    isVisitedAppointment: {
      type: Boolean,
      default: false
    },
    visitedDate: {
      type: String,
      default: ""
    },

    visitedByBaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    visitedAt: {
      type: Date,
      default: null
    },

    dealClosedByBaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    dealClosedAt: {
      type: Date,
      default: null
    },

    isVisitedNotInterested: {
      type: Boolean,
      default: false
    },

    visitedRejectionReason: {
      type: String,
      enum: ["", "Not Interested"],
      default: ""
    },

    visitedRejectedAt: {
      type: Date,
      default: null
    },

    rejectedFromAppointment: {
      type: Boolean,
      default: false
    },

    rejectionReason: {
      type: String,
      enum: ["", "Not Interested"],
      default: ""
    },

    appointmentRejectedAt: {
      type: Date,
      default: null
    },
    presentationUpdatedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

presentationDetailSchema.index({ userId: 1, date: 1 });

export default mongoose.model("PresentationDetail", presentationDetailSchema);