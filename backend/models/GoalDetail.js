import mongoose from "mongoose";

const goalDetailSchema = new mongoose.Schema(
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

    // DAILY
    appointmentFixingGoal: {
      type: Number,
      default: 0
    },
    appointmentVisitingGoal: {
      type: Number,
      default: 0
    },
    formsGoal: {
      type: Number,
      default: 0
    },
    revenueGoal: {
      type: Number,
      default: 0
    },

    // WEEKLY
    weeklyCallsGoal: {
      type: Number,
      default: 0
    },
    weeklyPresentationsGoal: {
      type: Number,
      default: 0
    },
    weeklyAppointmentFixingGoal: {
      type: Number,
      default: 0
    },
    weeklyAppointmentVisitingGoal: {
      type: Number,
      default: 0
    },
    weeklyFormsGoal: {
      type: Number,
      default: 0
    },
    weeklyRevenueGoal: {
      type: Number,
      default: 0
    },

    // MONTHLY
    monthlyCallsGoal: {
      type: Number,
      default: 0
    },
    monthlyPresentationsGoal: {
      type: Number,
      default: 0
    },
    monthlyAppointmentFixingGoal: {
      type: Number,
      default: 0
    },
    monthlyAppointmentVisitingGoal: {
      type: Number,
      default: 0
    },
    monthlyFormsGoal: {
      type: Number,
      default: 0
    },
    monthlyRevenueGoal: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

goalDetailSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("GoalDetail", goalDetailSchema);