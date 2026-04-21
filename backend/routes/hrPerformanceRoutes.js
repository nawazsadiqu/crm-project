import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { hrOnly } from "../middleware/hrMiddleware.js";
import { getMonthlyPerformance } from "../controllers/hrPerformanceController.js";

const router = express.Router();

router.get("/", protect, hrOnly, getMonthlyPerformance);

export default router;