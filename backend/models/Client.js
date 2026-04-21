import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true
    },
    businessName: {
      type: String,
      required: true
    },
    mapLocation: {
      type: String
    },
    service: {
      type: String
    },
    amount: {
      type: Number,
      default: 0
    },
    clientEmail: {
      type: String
    },
    password: {
      type: String
    },
    photos: {
      buildingPhoto: String,
      boardPhoto: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);