import mongoose from "mongoose";

const hrCallLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    calls: [
  {
    callNumber: {
      type: Number,
      required: true,
    },

    callingDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HrCallingData",
      default: null,
    },

    candidateName: {
      type: String,
      default: "",
      trim: true,
    },

    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },

    qualification: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
          type: String,
          enum: [
            "INTERESTED",
            "NOT_INTERESTED",
            "NOT_SELECTED",
            "CALL_BACK",
            "NOT_LIFTING",
            "NOT_CONNECTED",
          ],
          required: true,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

hrCallLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("HrCallLog", hrCallLogSchema);