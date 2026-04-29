import mongoose from "mongoose";

const callingDataSchema = new mongoose.Schema(
  {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isIgnored: {
      type: Boolean,
      default: false
    },

    serialNumber: {
      type: Number,
      default: 0
    },

    businessName: {
      type: String,
      required: true,
      trim: true
    },

    contactNumber: {
      type: String,
      default: "",
      trim: true
    },

    mapLink: {
      type: String,
      default: "",
      trim: true
    },

    response1: {
      type: String,
      default: ""
    },

    response1Date: {
      type: String,
      default: ""
    },

    response2: {
      type: String,
      default: ""
    },

    response2Date: {
      type: String,
      default: ""
    },

    response3: {
      type: String,
      default: ""
    },

    response3Date: {
      type: String,
      default: ""
    },

    lastResponse: {
      type: String,
      default: ""
    },

    lastResponseDate: {
      type: String,
      default: ""
    },

    lastStatus: {
      type: String,
      default: ""
    },

    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

callingDataSchema.index({ assignedTo: 1, createdAt: -1 });

export default mongoose.model("CallingData", callingDataSchema);