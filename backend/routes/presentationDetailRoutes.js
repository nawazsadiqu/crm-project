import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPresentationDetailByDate,
  savePresentationDetail,
  deletePresentationDetail,
  getAppointmentsByDate,
  getCallbackAppointmentsByDate,
  getRejectedAppointmentsByDate,
  updateVisitedAppointmentStatus,
  getVisitedAppointmentsByDate,
  updateAppointmentNotes,
  updateAppointmentDate,
  updateCallbackAppointmentNotes,
  updateCallbackAppointmentDate,
  updateVisitedResponse,
  updateAppointmentResponse,
} from "../controllers/presentationDetailController.js";

const router = express.Router();

router.get("/", protect, getPresentationDetailByDate);
router.get("/appointments", protect, getAppointmentsByDate);
router.get("/callback-appointments", protect, getCallbackAppointmentsByDate);
router.get("/rejected-appointments", protect, getRejectedAppointmentsByDate);
router.get("/visited-appointments", protect, getVisitedAppointmentsByDate);

router.post("/", protect, savePresentationDetail);
router.put("/callback-appointments/:id/notes", protect, updateCallbackAppointmentNotes);
router.put("/callback-appointments/:id/callback-date", protect, updateCallbackAppointmentDate);
router.put("/appointments/:id/appointment-date", protect, updateAppointmentDate);
router.put("/appointments/:id/response", protect, updateAppointmentResponse);
router.put("/visited-appointments/:id/response", protect, updateVisitedResponse);


router.put("/appointments/:id/visit-status", protect, updateVisitedAppointmentStatus);
router.put("/appointments/:id/notes", protect, updateAppointmentNotes);

router.delete("/:id", protect, deletePresentationDetail);

export default router;