import mongoose from "mongoose";

const digitalMarketingPlannerSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormDetail",
      required: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    selectedServices: {
      type: [String],
      default: []
    },

    posterImagesRequired: {
      type: Number,
      default: 0
    },
    reelsRequired: {
      type: Number,
      default: 0
    },
    posterImagesDone: {
      type: Number,
      default: 0
    },
    reelsDone: {
      type: Number,
      default: 0
    },

    googleAdsCampaignStatus: {
      type: String,
      enum: ["Active", "Inactive", ""],
      default: ""
    },
    googleAdsPriceDetails: {
      type: String,
      default: "",
      trim: true
    },

    metaAdsCampaignStatus: {
      type: String,
      enum: ["Active", "Inactive", ""],
      default: ""
    },
    metaAdsPriceDetails: {
      type: String,
      default: "",
      trim: true
    },

    otherServiceDetails: {
      type: String,
      default: "",
      trim: true
    },
    otherServiceRequired: {
      type: String,
      default: "",
      trim: true
    },
    otherServiceDone: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "DigitalMarketingPlanner",
  digitalMarketingPlannerSchema
);