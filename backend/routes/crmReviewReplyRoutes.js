import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getReviewReplyBusinesses,
  saveReviewReplyWeeklyStatus,
  getReviewReplyWeeklyCount
} from "../controllers/crmReviewReplyController.js";

const router = express.Router();

router.get("/", protect, getReviewReplyBusinesses);
router.get("/weekly-count", protect, getReviewReplyWeeklyCount);
router.post("/weekly-status", protect, saveReviewReplyWeeklyStatus);

export default router;