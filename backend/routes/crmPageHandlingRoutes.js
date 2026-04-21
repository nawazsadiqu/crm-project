import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPageHandlingBusinesses,
  savePageHandlingComment
} from "../controllers/crmPageHandlingController.js";

const router = express.Router();

router.get("/", protect, getPageHandlingBusinesses);
router.post("/comment", protect, savePageHandlingComment);

export default router;