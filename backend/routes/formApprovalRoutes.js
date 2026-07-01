import express from "express";
import FormApprovalRequest from "../models/FormApprovalRequest.js";
import FormDetail from "../models/FormDetail.js";
import sendEmail from "../utils/sendEmail.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

const getServiceTimelineLines = (services = []) => {
  const lines = [];
  const lowerServices = services.map((s) => s.toLowerCase());

  if (lowerServices.some((s) => s.includes("photo"))) {
    lines.push(
      "Within 7 working days, you will receive a confirmation call regarding the photoshoot date."
    );
    lines.push(
      "Within 15 working days, your photoshoot process will be completed."
    );
    lines.push(
      "Within 21 working days, the photoshoot will be published on your Google Business Profile."
    );
  }

  if (lowerServices.some((s) => s.includes("optimiz"))) {
    lines.push(
      "The optimization process will be completed within 20-25 working days."
    );
  }

  if (lowerServices.some((s) => s.includes("contact"))) {
    lines.push(
      "The contact number update process will be completed within 21 working days."
    );
  }

  return lines;
};

const sendApprovedFormEmail = async (newRecord) => {
  if (!newRecord.email) return;

  const selectedServices = [
    ...(Array.isArray(newRecord.googleServices) ? newRecord.googleServices : []),
    ...(newRecord.googleServicesOther ? [newRecord.googleServicesOther] : []),
    ...(Array.isArray(newRecord.otherServices) ? newRecord.otherServices : []),
    ...(newRecord.otherServicesOther ? [newRecord.otherServicesOther] : [])
  ];

  const serviceList =
    selectedServices.length > 0
      ? selectedServices.join(", ")
      : "Selected Services";

  const timelineLines = getServiceTimelineLines(selectedServices);

  const timelineSection =
    timelineLines.length > 0
      ? `What happens next:\n\n${timelineLines.join("\n")}\n\n`
      : "";

  const message = `Hi ${newRecord.fullName || "Sir/Madam"},

Thank you for choosing Conquest Techno Solutions.

We are happy to inform you that we have received your request successfully.

Business Name: ${newRecord.businessName}
Owner Name: ${newRecord.fullName || "N/A"}
Services Opted: ${serviceList}
Selected Package Amount: ₹${Number(newRecord.revenue || 0).toLocaleString("en-IN", {
maximumFractionDigits: 0
})}

${timelineSection}If you have any queries, feel free to connect with us.

Email: info@conquesttechnosolutions.com
Mobile: 7094090508

Thanks & Regards  
Conquest Techno Solutions`;

  await sendEmail(
    newRecord.email,
    "Thank You for Choosing Conquest Techno Solutions",
    message
  );
};

router.get(
  "/pending",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const requests = await FormApprovalRequest.find({
        status: "PENDING"
      }).sort({ createdAt: -1 });

      res.status(200).json(requests);
    } catch (error) {
      console.error("Fetch form approvals error:", error);
      res.status(500).json({
        message: "Failed to fetch pending approval requests"
      });
    }
  }
);

router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const approvalRequest = await FormApprovalRequest.findById(req.params.id);

      if (!approvalRequest) {
        return res.status(404).json({
          message: "Approval request not found"
        });
      }

      if (approvalRequest.status !== "PENDING") {
        return res.status(400).json({
          message: "This request is already processed"
        });
      }

      const newRecord = await FormDetail.create({
        ...approvalRequest.formData,
        isDuplicateTransactionApproved: true,
        duplicateTransactionApprovalRequestId: approvalRequest._id,
        duplicateTransactionApprovedBy: req.user.id,
        duplicateTransactionApprovedAt: new Date()
      });

      approvalRequest.status = "APPROVED";
      approvalRequest.approvedBy = req.user.id;
      approvalRequest.approvedAt = new Date();
      approvalRequest.adminComment = req.body.adminComment || "";
      approvalRequest.savedFormId = newRecord._id;

      await approvalRequest.save();

      try {
        await sendApprovedFormEmail(newRecord);
      } catch (emailError) {
        console.error("Approved form email failed:", emailError.message);
      }

      res.status(200).json({
        message: "Approved successfully. Form saved.",
        data: newRecord
      });
    } catch (error) {
      console.error("Approve form approval error:", error);
      res.status(500).json({
        message: "Failed to approve request"
      });
    }
  }
);

router.patch(
  "/:id/reject",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const approvalRequest = await FormApprovalRequest.findById(req.params.id);

      if (!approvalRequest) {
        return res.status(404).json({
          message: "Approval request not found"
        });
      }

      if (approvalRequest.status !== "PENDING") {
        return res.status(400).json({
          message: "This request is already processed"
        });
      }

      approvalRequest.status = "REJECTED";
      approvalRequest.rejectedBy = req.user.id;
      approvalRequest.rejectedAt = new Date();
      approvalRequest.adminComment = req.body.adminComment || "";

      await approvalRequest.save();

      res.status(200).json({
        message: "Request rejected successfully"
      });
    } catch (error) {
      console.error("Reject form approval error:", error);
      res.status(500).json({
        message: "Failed to reject request"
      });
    }
  }
);

export default router;