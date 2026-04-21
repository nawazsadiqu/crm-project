import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getTmcLogByDate, saveTmcLog } from "../controllers/tmcController.js";

const router = express.Router();

router.get("/", protect, getTmcLogByDate);
router.post("/", protect, saveTmcLog);

export default router;