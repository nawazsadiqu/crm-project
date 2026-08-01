import express from "express";
import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

import {
  bulkCreateCallingData,
  getMyCallingData,
  getAdminCallingData,
  getAllCallingData,
  updateCallingDataResponse,
  updateCallingDataContactNumber,
  updateCallingDataIgnoredStatus, 
  deleteCallingData,
} from "../controllers/callingDataController.js";

const router = express.Router();

// BA route
router.get("/my", protect, getMyCallingData);
router.get("/admin-view", protect, authorizeRoles("admin"), getAdminCallingData);

// Admin/HR upload and manage routes
router.post("/bulk", protect, bulkCreateCallingData);
router.get("/", protect, getAllCallingData);
router.delete("/:id", protect, deleteCallingData);

// BA updates response from TMC
router.put("/:id/response", protect, updateCallingDataResponse);
router.put("/:id/contact-number", protect, updateCallingDataContactNumber);
router.put("/:id/ignored", protect, updateCallingDataIgnoredStatus);

export default router;