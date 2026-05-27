import mongoose from "mongoose";

const hrCallingDataSchema = new mongoose.Schema(
  {
    serialNumber: Number,
    candidateName: String,
    contactNumber: String,
    qualification: String,
    location: String,
    experience: String,
    notes: String,

    response1: String,
    response1Date: String,

    response2: String,
    response2Date: String,

    response3: String,
    response3Date: String,

    response4: String,
    response4Date: String,

    lastResponse: String,

    isDeleted: {
      type: Boolean,
      default: false,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("HrCallingData", hrCallingDataSchema);