import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
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
  markAppointmentNotInterested,
  markVisitedAppointmentNotInterested,
  markCallbackAppointmentNotInterested,
  getTelecallerAppointmentsForAdmin,
  assignTelecallerAppointmentToBa,
  getAssignedTelecallerAppointmentsForBa,
  updateTelecallerAppointmentVisitStatus,
  updateTelecallerAppointmentVisitedResponse,
  reopenTelecallerAppointment,
  markTelecallerAppointmentDealClosed,
  markTelecallerAppointmentNotInterested,
  getTelecallerClosedDealsPendingForm
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
router.put("/callback-appointments/:id/not-interested", protect, markCallbackAppointmentNotInterested);
router.put("/appointments/:id/appointment-date", protect, updateAppointmentDate);
router.put("/appointments/:id/response", protect, updateAppointmentResponse);
router.put("/visited-appointments/:id/response", protect, updateVisitedResponse);
router.put("/visited-appointments/:id/not-interested", protect, markVisitedAppointmentNotInterested);
router.put("/appointments/:id/not-interested", protect, markAppointmentNotInterested);

router.put("/appointments/:id/visit-status", protect, updateVisitedAppointmentStatus);
router.put("/appointments/:id/notes", protect, updateAppointmentNotes);

router.get(
  "/telecaller-appointments/admin",
  protect,
  authorizeRoles("admin"),
  getTelecallerAppointmentsForAdmin
);

router.put(
  "/telecaller-appointments/:id/assign-ba",
  protect,
  authorizeRoles("admin"),
  assignTelecallerAppointmentToBa
);

router.get(
  "/telecaller-appointments/ba",
  protect,
  authorizeRoles("ba"),
  getAssignedTelecallerAppointmentsForBa
);

router.put(
  "/telecaller-appointments/:id/visit-status",
  protect,
  authorizeRoles("ba"),
  updateTelecallerAppointmentVisitStatus
);


router.put(
  "/telecaller-appointments/:id/visited-response",
  protect,
  authorizeRoles("ba"),
  updateTelecallerAppointmentVisitedResponse
);

router.put(
  "/telecaller-appointments/:id/reopen",
  protect,
  authorizeRoles("ba"),
  reopenTelecallerAppointment
);


router.put(
  "/telecaller-appointments/:id/deal-closed",
  protect,
  authorizeRoles("ba"),
  markTelecallerAppointmentDealClosed
);

router.put(
  "/telecaller-appointments/:id/not-interested",
  protect,
  authorizeRoles("ba"),
  markTelecallerAppointmentNotInterested
);

router.get(
  "/telecaller-appointments/form-pending",
  protect,
  authorizeRoles("telecaller"),
  getTelecallerClosedDealsPendingForm
);

router.delete("/:id", protect, deletePresentationDetail);

export default router;