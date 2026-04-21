import mongoose from "mongoose";

const optimizationUpdateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormDetail",
      required: true
    },
    weekKey: {
      type: String,
      required: true,
      trim: true
    },
    weekStartDate: {
      type: String,
      required: true,
      trim: true
    },
    weekEndDate: {
      type: String,
      required: true,
      trim: true
    },
    weeklyUpdateStatus: {
      type: String,
      enum: ["Updated", "Pending"],
      default: "Pending"
    },
    natureOfBusiness: {
      type: String,
      default: "",
      trim: true
    },
    statusMarkedUpdatedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

optimizationUpdateSchema.index(
  { userId: 1, formId: 1, weekKey: 1 },
  { unique: true }
);

export default mongoose.model("OptimizationUpdate", optimizationUpdateSchema);