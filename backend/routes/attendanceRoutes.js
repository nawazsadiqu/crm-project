import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { hrOnly } from "../middleware/hrMiddleware.js";
import {
  getAttendanceByDate,
  saveAttendanceByDate,
  getAttendanceSummaryByMonth
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/", protect, hrOnly, getAttendanceByDate);
router.get("/summary", protect, hrOnly, getAttendanceSummaryByMonth);
router.post("/", protect, hrOnly, saveAttendanceByDate);

export default router;