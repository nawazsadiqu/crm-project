import express from "express";
import {
  activityPing,
  activityLogout,
  getUserActivitySummary
} from "../controllers/userActivityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ping", protect, activityPing);
router.post("/logout", protect, activityLogout);
router.get("/summary", protect, getUserActivitySummary);

export default router;