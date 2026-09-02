import mongoose from "mongoose";

const hrCandidatePipelineSchema = new mongoose.Schema(
  {
    sourceCallingDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HrCallingData",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

    jobPortal: {
      type: String,
      default: "",
      trim: true,
    },

    interestedCandidate: {
      type: Boolean,
      default: false,
    },

    interestedAt: {
      type: Date,
      default: null,
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

    lastResponse: {
      type: String,
      default: "",
    },

    lastResponseCode: {
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

    resumeGot: {
      type: String,
      enum: ["", "Yes", "No"],
      default: "",
    },

    resumeGotDate: {
      type: String,
      default: "",
    },

    resumeGotBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    interview: {
      type: Boolean,
      default: false,
    },

    interviewDate: {
      type: String,
      default: "",
    },

    firstRoundAttended: {
  type: Boolean,
  default: false,
},

firstRoundAttendedDate: {
  type: String,
  default: "",
},

firstRoundAttendedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

secondRoundSelected: {
  type: Boolean,
  default: false,
},

secondRoundAttendedDate: {
  type: String,
  default: "",
},

secondRoundAttendedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

    joined: {
      type: Boolean,
      default: false,
    },

    joinedDate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "HrCandidatePipeline",
  hrCandidatePipelineSchema
);