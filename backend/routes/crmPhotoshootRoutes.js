import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPhotoshootBusinesses,
  savePhotoshootStatus
} from "../controllers/crmPhotoshootController.js";

const router = express.Router();

router.get("/", protect, getPhotoshootBusinesses);
router.post("/status", protect, savePhotoshootStatus);

export default router;