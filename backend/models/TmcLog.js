import mongoose from "mongoose";

const tmcLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    calls: [
      {
        callNumber: {
          type: Number,
          required: true
        },
        businessName: {
          type: String,
          default: "",
          trim: true
        },

        respondedAt: {
          type: Date,
          default: null
        },
        status: {
          type: String,
          enum: ["AP", "CBA", "CBP", "CC", "NI", "CCB", "NC", "NA", "P", "CTS_CLIENT"],
          required: true
        },
        notes: {
          type: String,
          default: ""
        },
        callbackDate: {
          type: String,
          default: ""
        },

        callbackTime: {
          type: String,
          default: ""
        }
      }
    ],
    presentations: [
      {
        presentationNumber: {
          type: Number,
          required: true
        },
        businessName: {
          type: String,
          default: "",
          trim: true
        },

        respondedAt: {
          type: Date,
          default: null
        },
        status: {
          type: String,
          enum: ["Appointment Fixed", "Rejected", "CBC", "CBA"],
          required: true
        },
        notes: {
          type: String,
          default: ""
        }
      }
    ],
    appointmentsVisited: {
      type: Number,
      default: 0
    },
    forms: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    manualNotes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

tmcLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("TmcLog", tmcLogSchema);