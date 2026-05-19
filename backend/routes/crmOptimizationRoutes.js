import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOptimizationBusinesses,
  saveOptimizationWeeklyStatus,
  getTodayOptimizationUpdateCount,
  updatePermanentOptimizationDetails
} from "../controllers/crmOptimizationController.js";

const router = express.Router();

router.get("/", protect, getOptimizationBusinesses);
router.get("/daily-count", protect, getTodayOptimizationUpdateCount);
router.post("/weekly-status", protect, saveOptimizationWeeklyStatus);
router.put("/:formId/permanent-details", protect, updatePermanentOptimizationDetails);

export default router;