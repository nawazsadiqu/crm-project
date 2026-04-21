import mongoose from "mongoose";

const websiteProjectPlannerSchema = new mongoose.Schema(
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
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "WebsiteProjectPlanner",
  websiteProjectPlannerSchema
);