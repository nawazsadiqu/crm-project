import express from "express";
import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { hrOnly } from "../middleware/hrMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);

// HR only register
router.post("/register", protect, hrOnly, registerUser);

// 🔥 NEW
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;