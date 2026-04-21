import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { hrOnly } from "../middleware/hrMiddleware.js";
import { getAllUsersForHr } from "../controllers/userController.js";

const router = express.Router();

router.get("/", protect, hrOnly, getAllUsersForHr);

export default router;