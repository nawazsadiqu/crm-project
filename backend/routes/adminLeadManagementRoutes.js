import express from "express";

import {
    protect,
    authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
    getAdminLeadManagement,
} from "../controllers/adminLeadManagementController.js";

const router = express.Router();

/*
  Every Lead Management route
  is Admin only.
*/
router.use(
    protect,
    authorizeRoles("admin")
);

router.get(
    "/",
    getAdminLeadManagement
);

export default router;