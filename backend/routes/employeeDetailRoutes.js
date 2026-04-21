import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { hrOnly } from "../middleware/hrMiddleware.js";
import {
  getAllEmployeeDetails,
  saveEmployeeDetail,
  updateEmployeeDetail,
  deleteEmployeeDetail,
  getMyEmployeeProfile,
  getUpcomingBirthdays
} from "../controllers/employeeDetailController.js";

const router = express.Router();

// employee self profile
router.get("/my-profile", protect, getMyEmployeeProfile);

// HR-only routes
router.get("/", protect, hrOnly, getAllEmployeeDetails);
router.post("/", protect, hrOnly, saveEmployeeDetail);
router.put("/:id", protect, hrOnly, updateEmployeeDetail);
router.delete("/:id", protect, hrOnly, deleteEmployeeDetail);
router.get("/upcoming-birthdays", protect, hrOnly, getUpcomingBirthdays);

export default router;