import mongoose from "mongoose";

const photoshootUpdateSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["Done", "Pending", ""],
      default: ""
    },

    uploadStatus: {
      type: String,
      enum: ["pending", "done"],
      default: "pending"
    }
  },
  { timestamps: true }
);

photoshootUpdateSchema.index(
  { userId: 1, formId: 1 },
  { unique: true }
);

export default mongoose.model("PhotoshootUpdate", photoshootUpdateSchema);