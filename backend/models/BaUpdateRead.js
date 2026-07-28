import mongoose from "mongoose";

const baUpdateReadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // Used for the main Updates unread badge
    lastReadAt: {
      type: Date,
      default: null
    },

    // Used only for the Recent Updates tab count
    lastRecentUpdatesViewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "BaUpdateRead",
  baUpdateReadSchema
);