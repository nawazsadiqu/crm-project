import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getBaUpdates,
  getBaUpdatesUnreadCount,
  markBaUpdatesAsRead,
  markRecentUpdatesAsRead
} from "../controllers/baUpdateController.js";

const router = express.Router();

router.get("/", protect, getBaUpdates);
router.get("/unread-count", protect, getBaUpdatesUnreadCount);
router.put("/mark-recent-read", protect, markRecentUpdatesAsRead);
router.put("/mark-read", protect, markBaUpdatesAsRead);

export default router;