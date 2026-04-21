import mongoose from "mongoose";

const mainDataSchema = new mongoose.Schema(
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
    totalCalls: {
      type: Number,
      default: 0
    },
    totalPresentations: {
      type: Number,
      default: 0
    },
    totalAppointments: {
      type: Number,
      default: 0
    },
    appointmentsVisited: {
      type: Number,
      default: 0
    },
    forms: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

mainDataSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("MainData", mainDataSchema);