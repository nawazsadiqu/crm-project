import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { websiteDeveloperOnly } from "../middleware/websiteDeveloperMiddleware.js";
import {
  getWebsiteBusinesses,
  getWebsiteBusinessOptions,
  getWebsiteProjects,
  saveWebsiteProject
} from "../controllers/websiteDeveloperController.js";

const router = express.Router();

router.get("/businesses", protect, websiteDeveloperOnly, getWebsiteBusinesses);
router.get("/business-options", protect, websiteDeveloperOnly, getWebsiteBusinessOptions);
router.get("/projects", protect, websiteDeveloperOnly, getWebsiteProjects);
router.post("/projects", protect, websiteDeveloperOnly, saveWebsiteProject);

export default router;