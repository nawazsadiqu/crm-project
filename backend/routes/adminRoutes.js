import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAdminDashboard,
  getAllUsers,
  getAttendanceOverview
} from "../controllers/adminController.js";

const router = express.Router();

// 🔒 All routes below are ADMIN ONLY
router.use(protect, authorizeRoles("admin"));

// 📊 Dashboard
router.get("/dashboard", getAdminDashboard);

// 👥 Users
router.get("/users", getAllUsers);

router.get("/attendance", getAttendanceOverview);

export default router;