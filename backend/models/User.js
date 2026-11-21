import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "hr", "ba", "telecaller", "crm", "websiteDeveloper", "digitalMarketing"],
      required: true,
      default: "ba"
    },

    telecallerCategory: {
      type: String,
      enum: ["GBP", "WEBSITE", "WHATSAPP_BROADCAST"],
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    resetPasswordCode: {
      type: String,
      default: ""
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);