
import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
    getTelecallerUpdates,
    getTelecallerUpdatesUnreadCount,
    markTelecallerUpdatesAsRead,
    markTelecallerRecentUpdatesAsRead
} from "../controllers/baUpdateController.js";

const router = express.Router();

// Telecaller business service updates
router.get("/", protect, getTelecallerUpdates);

// Unread updates count
router.get(
    "/unread-count",
    protect,
    getTelecallerUpdatesUnreadCount
);

// Mark business updates as read
router.put(
    "/mark-read",
    protect,
    markTelecallerUpdatesAsRead
);

// Mark recent updates as viewed
router.put(
    "/mark-recent-read",
    protect,
    markTelecallerRecentUpdatesAsRead
);

export default router;
