import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { digitalMarketingOnly } from "../middleware/digitalMarketingMiddleware.js";
import {
  getDigitalMarketingBusinesses,
  getDigitalMarketingBusinessOptions,
  getDigitalMarketingPlans,
  saveDigitalMarketingPlan
} from "../controllers/digitalMarketingController.js";

const router = express.Router();

router.get("/businesses", protect, digitalMarketingOnly, getDigitalMarketingBusinesses);
router.get("/business-options", protect, digitalMarketingOnly, getDigitalMarketingBusinessOptions);
router.get("/plans", protect, digitalMarketingOnly, getDigitalMarketingPlans);
router.post("/plans", protect, digitalMarketingOnly, saveDigitalMarketingPlan);

export default router;