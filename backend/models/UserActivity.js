import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
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
    loginTime: {
      type: Date,
      default: null
    },
    logoutTime: {
      type: Date,
      default: null
    },
    lastActiveAt: {
      type: Date,
      default: null
    },
    totalActiveSeconds: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

userActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("UserActivity", userActivitySchema);