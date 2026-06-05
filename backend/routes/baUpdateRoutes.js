import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getBaUpdates,
  getBaUpdatesUnreadCount,
  markBaUpdatesAsRead
} from "../controllers/baUpdateController.js";

const router = express.Router();

router.get("/", protect, getBaUpdates);
router.get("/unread-count", protect, getBaUpdatesUnreadCount);
router.put("/mark-read", protect, markBaUpdatesAsRead);

export default router;