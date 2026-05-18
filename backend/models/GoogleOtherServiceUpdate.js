import mongoose from "mongoose";

const googleOtherServiceUpdateSchema = new mongoose.Schema(
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
    }
  },
  { timestamps: true }
);

googleOtherServiceUpdateSchema.index(
  { formId: 1 },
  { unique: true }
);

export default mongoose.model("GoogleOtherServiceUpdate", googleOtherServiceUpdateSchema);