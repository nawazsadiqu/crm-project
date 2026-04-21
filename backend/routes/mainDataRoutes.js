import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMainDataByDate } from "../controllers/mainDataController.js";

const router = express.Router();

router.get("/", protect, getMainDataByDate);

export default router;