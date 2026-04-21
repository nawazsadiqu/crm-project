import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAdminBaList,
  getAdminBusinessDetails
} from "../controllers/adminBusinessDetailsController.js";

const router = express.Router();

// dropdown BA list
router.get(
  "/ba-list",
  protect,
  authorizeRoles("admin"),
  getAdminBaList
);

// business details
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAdminBusinessDetails
);

export default router;