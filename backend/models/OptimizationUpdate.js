import mongoose from "mongoose";

const optimizationUpdateSchema = new mongoose.Schema(
  {
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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
    statusMarkedUpdatedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

optimizationUpdateSchema.index(
  { formId: 1, weekKey: 1 },
  { unique: true }
);

export default mongoose.model("OptimizationUpdate", optimizationUpdateSchema);