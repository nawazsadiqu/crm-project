import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAdminPerformance,
  getAdminPerformanceChart,
  getAdminGoalDetails
} from "../controllers/adminPerformanceController.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), getAdminPerformance);
router.get("/chart", protect, authorizeRoles("admin"), getAdminPerformanceChart);
router.get("/goals/details", protect, authorizeRoles("admin"), getAdminGoalDetails);

export default router;