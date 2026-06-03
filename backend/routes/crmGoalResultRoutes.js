import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCrmGoalsAndResults,
  saveCrmGoalsAndResults
} from "../controllers/crmGoalResultController.js";

const router = express.Router();

router.get("/", protect, getCrmGoalsAndResults);
router.post("/", protect, saveCrmGoalsAndResults);

export default router;