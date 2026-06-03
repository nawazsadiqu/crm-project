import mongoose from "mongoose";

const crmGoalResultSchema = new mongoose.Schema(
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

    goalType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true
    },

    goals: {
      posters: { type: Number, default: 0 },
      reviewReplies: { type: Number, default: 0 },
      contactEscalation: { type: Number, default: 0 },
      otherEscalation: { type: Number, default: 0 },
      clientsQuery: { type: Number, default: 0 },
      schedulingPhotoshoot: { type: Number, default: 0 },
      uploadingPhotoshoot: { type: Number, default: 0 },
      contactReEscalation: { type: Number, default: 0 },
      otherReEscalation: { type: Number, default: 0 },
      monthlyReports: { type: Number, default: 0 },
      clientDataRenewal: { type: Number, default: 0 }
    },

    results: {
      posters: { type: Number, default: 0 },
      reviewReplies: { type: Number, default: 0 },
      contactEscalation: { type: Number, default: 0 },
      otherEscalation: { type: Number, default: 0 },
      clientsQuery: { type: Number, default: 0 },
      schedulingPhotoshoot: { type: Number, default: 0 },
      uploadingPhotoshoot: { type: Number, default: 0 },
      contactReEscalation: { type: Number, default: 0 },
      otherReEscalation: { type: Number, default: 0 },
      monthlyReports: { type: Number, default: 0 },
      clientDataRenewal: { type: Number, default: 0 }
    },

    lastUpdatedAt: {
      type: Date,
      default: null
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

crmGoalResultSchema.index(
  { userId: 1, date: 1, goalType: 1 },
  { unique: true }
);

export default mongoose.model("CrmGoalResult", crmGoalResultSchema);