import mongoose from "mongoose";

const hrCallLogSchema = new mongoose.Schema(
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
    calls: [
      {
        callNumber: {
          type: Number,
          required: true
        },
        status: {
          type: String,
          enum: [
            "NL",
            "NL_CC",
            "NL_NC",
            "B",
            "CC",
            "ANS_RS",
            "ANS_CC",
            "ANS_NI",
            "ANS_NW",
            "ANS_NM",
            "ANS_CB",
            "ANS_NS"
          ],
          required: true
        },
        notes: {
          type: String,
          default: ""
        }
      }
    ]
  },
  { timestamps: true }
);

// unique per user per day
hrCallLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("HrCallLog", hrCallLogSchema);