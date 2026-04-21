import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAdminPerformance,
  getAdminPerformanceChart
} from "../controllers/adminPerformanceController.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), getAdminPerformance);
router.get("/chart", protect, authorizeRoles("admin"), getAdminPerformanceChart);

export default router;