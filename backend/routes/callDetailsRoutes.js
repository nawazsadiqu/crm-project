import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getCallDetailsByDate } from "../controllers/callDetailsController.js";

const router = express.Router();

router.get("/", protect, getCallDetailsByDate);

export default router;