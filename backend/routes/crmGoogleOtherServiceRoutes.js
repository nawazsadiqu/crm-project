import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGoogleOtherServiceBusinesses,
  saveGoogleOtherServiceComment
} from "../controllers/crmGoogleOtherServiceController.js";

const router = express.Router();

router.get("/", protect, getGoogleOtherServiceBusinesses);
router.post("/comment", protect, saveGoogleOtherServiceComment);

export default router;