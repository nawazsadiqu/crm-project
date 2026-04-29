import mongoose from "mongoose";

const presentationDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
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

    notes: {
      type: String,
      default: "",
      trim: true
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
    }
  },
  { timestamps: true }
);

presentationDetailSchema.index({ userId: 1, date: 1 });

export default mongoose.model("PresentationDetail", presentationDetailSchema);