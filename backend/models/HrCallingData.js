import mongoose from "mongoose";

const hrCallingDataSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      default: 0,
    },

    uploadBatch: {
      type: Number,
      default: 1,
    },

    candidateName: {
      type: String,
      default: "",
      trim: true,
    },

    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },

    qualification: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
    },

    response1: {
      type: String,
      default: "",
    },
    response1Date: {
      type: String,
      default: "",
    },

    response2: {
      type: String,
      default: "",
    },
    response2Date: {
      type: String,
      default: "",
    },

    response3: {
      type: String,
      default: "",
    },
    response3Date: {
      type: String,
      default: "",
    },

    response4: {
      type: String,
      default: "",
    },
    response4Date: {
      type: String,
      default: "",
    },

    response5: {
      type: String,
      default: "",
    },
    response5Date: {
      type: String,
      default: "",
    },

    lastResponse: {
      type: String,
      default: "",
    },

    lastResponseDate: {
      type: String,
      default: "",
    },

    lastCallNumber: {
      type: Number,
      default: 0,
    },

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