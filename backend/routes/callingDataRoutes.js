import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { hrOnly } from "../middleware/hrMiddleware.js";
import {
  bulkCreateCallingData,
  getMyCallingData,
  getAllCallingData,
  updateCallingDataResponse,
  deleteCallingData
} from "../controllers/callingDataController.js";

const router = express.Router();

// BA route
router.get("/my", protect, getMyCallingData);

// Admin/HR upload and manage routes
router.post("/bulk", protect, bulkCreateCallingData);
router.get("/", protect, getAllCallingData);
router.delete("/:id", protect, deleteCallingData);

// BA updates response from TMC
router.put("/:id/response", protect, updateCallingDataResponse);

export default router;