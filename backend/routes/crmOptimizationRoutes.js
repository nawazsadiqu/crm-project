import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOptimizationBusinesses,
  saveOptimizationWeeklyStatus,
  getTodayOptimizationUpdateCount
} from "../controllers/crmOptimizationController.js";

const router = express.Router();

router.get("/", protect, getOptimizationBusinesses);
router.get("/daily-count", protect, getTodayOptimizationUpdateCount);
router.post("/weekly-status", protect, saveOptimizationWeeklyStatus);

export default router;