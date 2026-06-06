import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGmbQueries,
  createGmbQuery,
  updateGmbQueryStatus,
  deleteGmbQuery,
  getActiveBaListForGmbQueries,
  getUnreadGmbQueryCount,
  markGmbQueriesRead
} from "../controllers/gmbQueryController.js";

const router = express.Router();

router.get("/ba-list", protect, getActiveBaListForGmbQueries);
router.get("/unread-count", protect, getUnreadGmbQueryCount);
router.put("/mark-read", protect, markGmbQueriesRead);
router.get("/", protect, getGmbQueries);
router.post("/", protect, createGmbQuery);
router.put("/:id/status", protect, updateGmbQueryStatus);
router.delete("/:id", protect, deleteGmbQuery);


export default router;  