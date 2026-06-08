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