import mongoose from "mongoose";

const gmbQuerySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    businessName: { type: String, required: true, trim: true },
    baName: { type: String, default: "", trim: true },
    comment: { type: String, default: "", trim: true },
    mapLink: { type: String, default: "", trim: true },
    contactNumber: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["not done", "done"],
      default: "not done"
    },
    readBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    doneAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("GmbQuery", gmbQuerySchema);