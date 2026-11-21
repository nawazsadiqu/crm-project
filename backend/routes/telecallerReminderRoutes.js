
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
    getTelecallerTodayReminders
} from "../controllers/telecallerReminderController.js";

const router = express.Router();

router.get(
    "/today",
    protect,
    (req, res, next) => {
        if (req.user?.role !== "telecaller") {
            return res.status(403).json({
                message: "Telecaller access only"
            });
        }

        next();
    },
    getTelecallerTodayReminders
);

export default router;
