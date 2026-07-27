import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTmcLogByDate,
  saveTmcLog,
  getCallBackPresentations,
  deleteCallBackPresentation,
  updateCallBackPresentationManualNote,
  updateCallBackPresentationDate
} from "../controllers/tmcController.js";

const router = express.Router();

router.get("/", protect, getTmcLogByDate);
router.post("/", protect, saveTmcLog);
router.get("/callback-presentations", protect, getCallBackPresentations);
router.delete("/callback-presentations/:logId/:callNumber", protect, deleteCallBackPresentation);
router.patch("/callback-presentations/:logId/:callNumber/manual-note",protect,updateCallBackPresentationManualNote);
router.patch("/callback-presentations/:logId/:callNumber/callback-date",protect,updateCallBackPresentationDate);

export default router;