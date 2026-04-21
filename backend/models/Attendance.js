import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true
    },
    employeeId: {
      type: String,
      required: true,
      trim: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true,
      default: "Present"
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ date: 1, employeeId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);