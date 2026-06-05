import mongoose from "mongoose";

const baUpdateReadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    lastReadAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("BaUpdateRead", baUpdateReadSchema);