import mongoose from "mongoose";

const employeeDetailSchema = new mongoose.Schema(
  {
      userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    number: {
      type: String,
      default: "",
      trim: true
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    mailId: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      default: "",
      trim: true
    },
    salary: {
      type: Number,
      default: 0
    },
    dob: {
      type: String,
      default: ""
    },
    birthMonth: {
      type: String,
      default: "",
      trim: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: ""
    },
    qualification: {
      type: String,
      default: "",
      trim: true
    },
    role: {
      type: String,
       enum: ["admin", "hr", "ba", "crm", "websiteDeveloper", "digitalMarketing"],
      required: true
    },
    father: {
      type: String,
      default: "",
      trim: true
    },
    mother: {
      type: String,
      default: "",
      trim: true
    },
    parentsNo: {
      type: String,
      default: "",
      trim: true
    },
    address: {
      type: String,
      default: "",
      trim: true
    },
    dateOfJoin: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeDetail", employeeDetailSchema);