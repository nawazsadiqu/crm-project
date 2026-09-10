import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFormDetailsByMonth,
  getClosedClients,
  saveFormDetail,
  updateFormDetail,
  deleteFormDetail
} from "../controllers/formDetailController.js";

const router = express.Router();

router.get("/closed-clients", protect, getClosedClients);
router.get("/", protect, getFormDetailsByMonth);
router.post("/", protect, saveFormDetail);
router.delete("/:id", protect, deleteFormDetail);
router.put("/:id", protect, updateFormDetail);

export default router;