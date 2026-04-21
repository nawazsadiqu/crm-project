import mongoose from "mongoose";

const suspendedPageUpdateSchema = new mongoose.Schema(
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

    comment: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

suspendedPageUpdateSchema.index(
  { userId: 1, formId: 1 },
  { unique: true }
);

export default mongoose.model("SuspendedPageUpdate", suspendedPageUpdateSchema);