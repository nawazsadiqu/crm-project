import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getBaDashboardSummary } from "../controllers/baDashboardController.js";

const router = express.Router();

router.get("/summary", protect, getBaDashboardSummary);

export default router;