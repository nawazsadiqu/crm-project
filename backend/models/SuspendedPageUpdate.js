import mongoose from "mongoose";

const suspendedPageUpdateSchema = new mongoose.Schema(
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

    comment: {
      type: String,
      default: "",
      trim: true
    },

    escalationStatus: {
      type: String,
      enum: ["not escalated", "escalated", "live"],
      default: "not escalated"
    },

    escalationId: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

suspendedPageUpdateSchema.index(
  { formId: 1 },
  { unique: true }
);

export default mongoose.model("SuspendedPageUpdate", suspendedPageUpdateSchema);