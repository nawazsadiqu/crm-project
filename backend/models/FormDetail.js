import mongoose from "mongoose";

const formDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      default: "",
      trim: true
    },

    revenue: {
      type: Number,
      required: true,
      default: 0
    },

    exGst: {
      type: Number,
      required: true,
      default: 0
    },

    profitSharing: {
      type: Number,
      required: true,
      default: 0
    },

    pincode: {
      type: String,
      default: "",
      trim: true
    },

    city: {
      type: String,
      default: "",
      trim: true
    },

    area: {
      type: String,
      default: "",
      trim: true
    },

    baName: {
      type: String,
      default: "",
      trim: true
    },

    baId: {
      type: String,
      default: "",
      trim: true
    },

    businessName: {
      type: String,
      required: true,
      trim: true
    },

    mobileNumber: {
      type: String,
      default: "",
      trim: true
    },

    fullName: {
      type: String,
      default: "",
      trim: true
    },

    address: {
      type: String,
      default: "",
      trim: true
    },

    gstNumber: {
      type: String,
      default: "",
      trim: true
    },

    gstInvoiceName: {
      type: String,
      default: "",
      trim: true
    },

    typeOfBusiness: {
      type: String,
      enum: ["Proprietor", "Partnership", "PVT LTD", "Other", ""],
      default: ""
    },

    typeOfBusinessOther: {
      type: String,
      default: "",
      trim: true
    },

    googleMapLink: {
      type: String,
      default: "",
      trim: true
    },

    transactionIdOrChequeNumber: {
      type: String,
      default: "",
      trim: true
    },

    paymentDetails: {
      type: String,
      enum: ["Cheque", "UPI", "RTGS", "NEFT", "Other", ""],
      default: ""
    },

    paymentDetailsOther: {
      type: String,
      default: "",
      trim: true
    },

    serviceCategory: {
      type: String,
      enum: ["googleServices", "otherServices", ""],
      default: ""
    },

    googleServices: {
      type: [String],
      default: []
    },

    googleServicesOther: {
      type: String,
      default: "",
      trim: true
    },

    otherServices: {
      type: [String],
      default: []
    },

    otherServicesOther: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

formDetailSchema.index({ userId: 1, date: 1 });

export default mongoose.model("FormDetail", formDetailSchema);