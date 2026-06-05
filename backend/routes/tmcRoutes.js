import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getTmcLogByDate, saveTmcLog, getCallBackPresentations, deleteCallBackPresentation } from "../controllers/tmcController.js";

const router = express.Router();

router.get("/", protect, getTmcLogByDate);
router.post("/", protect, saveTmcLog);
router.get("/callback-presentations", protect, getCallBackPresentations);
router.delete("/callback-presentations/:logId/:callNumber", protect, deleteCallBackPresentation);

export default router;