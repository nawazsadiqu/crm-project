import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPhotoshootBusinesses,
  savePhotoshootStatus,
  updatePhotoshootComment
} from "../controllers/crmPhotoshootController.js";

const router = express.Router();

router.get("/", protect, getPhotoshootBusinesses);
router.post("/status", protect, savePhotoshootStatus);
router.put("/:formId/comment", protect, updatePhotoshootComment);

export default router;