import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFormDetailsByMonth,
  saveFormDetail,
  deleteFormDetail
} from "../controllers/formDetailController.js";

const router = express.Router();

router.get("/", protect, getFormDetailsByMonth);
router.post("/", protect, saveFormDetail);
router.delete("/:id", protect, deleteFormDetail);

export default router;