import mongoose from "mongoose";

const hrGoalDetailSchema = new mongoose.Schema(
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

    // Daily Goals
    dailyCallsGoal: { type: Number, default: 0 },
    dailyResumesGoal: { type: Number, default: 0 },
    dailySchedulingInterviewGoal: { type: Number, default: 0 },
    dailyDataSourcingGoal: { type: Number, default: 0 },

    // Weekly Goals
    weeklyCallsGoal: { type: Number, default: 0 },
    weeklyResumesGoal: { type: Number, default: 0 },
    weeklySchedulingInterviewGoal: { type: Number, default: 0 },
    weeklyDataSourcingGoal: { type: Number, default: 0 },

    // Monthly Goals
    monthlyCallsGoal: { type: Number, default: 0 },
    monthlyResumesGoal: { type: Number, default: 0 },
    monthlySchedulingInterviewGoal: { type: Number, default: 0 },
    monthlyDataSourcingGoal: { type: Number, default: 0 },

    // Manual Results
    dailyDataSourcingResult: { type: Number, default: 0 },
    weeklyDataSourcingResult: { type: Number, default: 0 },
    monthlyDataSourcingResult: { type: Number, default: 0 },

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

hrGoalDetailSchema.index(
  { userId: 1, date: 1, goalType: 1 },
  { unique: true }
);

export default mongoose.model("HrGoalDetail", hrGoalDetailSchema);