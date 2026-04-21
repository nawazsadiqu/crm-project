import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSuspendedPageBusinesses,
  saveSuspendedPageComment
} from "../controllers/crmSuspendedPageController.js";

const router = express.Router();

router.get("/", protect, getSuspendedPageBusinesses);
router.post("/comment", protect, saveSuspendedPageComment);

export default router;