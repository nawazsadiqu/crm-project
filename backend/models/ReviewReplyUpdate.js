import mongoose from "mongoose";

const reviewReplyUpdateSchema = new mongoose.Schema(
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

    weeklyReplyStatus: {
      type: String,
      enum: ["Replied", "Pending"],
      default: "Pending"
    },

    statusMarkedRepliedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

reviewReplyUpdateSchema.index(
  { formId: 1, weekKey: 1 },
  { unique: true }
);

export default mongoose.model("ReviewReplyUpdate", reviewReplyUpdateSchema);