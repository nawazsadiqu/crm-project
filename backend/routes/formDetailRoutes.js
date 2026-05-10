import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFormDetailsByMonth,
  saveFormDetail,
  updateFormDetail,
  deleteFormDetail
} from "../controllers/formDetailController.js";

const router = express.Router();

router.get("/", protect, getFormDetailsByMonth);
router.post("/", protect, saveFormDetail);
router.delete("/:id", protect, deleteFormDetail);
router.put("/:id", protect, updateFormDetail);

export default router;