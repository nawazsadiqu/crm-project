import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getHrGoalsAndResults,
  saveHrGoals,
} from "../controllers/hrGoalDetailController.js";

const router = express.Router();

router.get("/", protect, getHrGoalsAndResults);
router.post("/", protect, saveHrGoals);

export default router;