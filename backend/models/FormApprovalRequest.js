import mongoose from "mongoose";

const formApprovalRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: [
        "DUPLICATE_TRANSACTION",
        "UNDERPAYMENT_ADDITIONAL_PAYMENT"
      ],
      default: "DUPLICATE_TRANSACTION"
    },

    approvalReason: {
      type: String,
      default: "",
      trim: true
    },

    transactionIdOrChequeNumber: {
      type: String,
      required: true,
      trim: true
    },

    transactionKey: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    existingFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormDetail",
      default: null
    },

    parentFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormDetail",
      default: null
    },

    existingFormSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    formData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    requestedByName: {
      type: String,
      default: "",
      trim: true
    },

    requestedByEmployeeId: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    adminComment: {
      type: String,
      default: "",
      trim: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    rejectedAt: {
      type: Date,
      default: null
    },

    savedFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormDetail",
      default: null
    }
  },
  { timestamps: true }
);

formApprovalRequestSchema.index({ transactionKey: 1, status: 1 });
formApprovalRequestSchema.index({ requestedBy: 1, status: 1 });
formApprovalRequestSchema.index({ requestType: 1, status: 1 });
formApprovalRequestSchema.index({ existingFormId: 1, status: 1 });

export default mongoose.model("FormApprovalRequest", formApprovalRequestSchema);