import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGmbProfileBusinesses,
  saveGmbProfileComment
} from "../controllers/crmGmbProfileController.js";

const router = express.Router();

router.get("/", protect, getGmbProfileBusinesses);
router.post("/comment", protect, saveGmbProfileComment);

export default router;