import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getContactNumberBusinesses,
  saveContactNumberComment
} from "../controllers/crmContactNumberController.js";

const router = express.Router();

router.get("/", protect, getContactNumberBusinesses);
router.post("/comment", protect, saveContactNumberComment);

export default router;