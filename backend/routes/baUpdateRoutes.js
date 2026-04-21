import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getBaUpdates } from "../controllers/baUpdateController.js";

const router = express.Router();

router.get("/", protect, getBaUpdates);

export default router;