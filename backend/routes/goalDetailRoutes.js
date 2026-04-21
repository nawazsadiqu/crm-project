import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGoalsAndResultsByDate,
  saveGoalsByDate
} from "../controllers/goalDetailController.js";

const router = express.Router();

router.get("/", protect, getGoalsAndResultsByDate);
router.post("/", protect, saveGoalsByDate);

export default router;