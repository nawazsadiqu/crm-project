import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getTodayBaReminders } from "../controllers/baReminderController.js";

const router = express.Router();

router.get("/today", protect, getTodayBaReminders);

export default router;