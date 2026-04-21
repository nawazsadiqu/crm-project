console.log("HR CALL ROUTES LOADED");
import express from "express";
import {
  saveHrCallLog,
  getHrCallLogByDate,
  getHrCallSummary
} from "../controllers/hrCallController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Save HR call data
router.post("/", protect, saveHrCallLog);

// Get HR call data by date
router.get("/", protect, getHrCallLogByDate);

router.get("/summary", protect, getHrCallSummary); 

export default router;