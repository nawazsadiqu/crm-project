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

const mergeUnique = (...arrays) => {
  return [...new Set(arrays.flat().filter(Boolean))];
};

const buildServiceList = (record) => {
  return [
    ...(Array.isArray(record.googleServices) ? record.googleServices : []),
    ...(record.googleServicesOther ? [record.googleServicesOther] : []),
    ...(Array.isArray(record.otherServices) ? record.otherServices : []),
    ...(record.otherServicesOther ? [record.otherServicesOther] : [])
  ];
};

const sendApprovedFormEmail = async (newRecord) => {
  if (!newRecord.email) return;

  const selectedServices = buildServiceList(newRecord);

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
Selected Package Amount: ₹${Number(newRecord.packageAmount || newRecord.revenue || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Payment Received Now: ₹${Number(newRecord.amountReceivedNow || newRecord.revenue || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Balance Amount: ₹${Number(newRecord.balanceAmount || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Payment Status: ${newRecord.paymentStatus || "Paid"}

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

const sendAdditionalPaymentEmail = async ({
  updatedRecord,
  packageAmountNumber,
  additionalAmount,
  newTotalReceived,
  balanceAmount,
  paymentStatus,
  transactionValue,
  paymentDate
}) => {
  if (!updatedRecord.email) return;

  const selectedServices = buildServiceList(updatedRecord);

  const serviceList =
    selectedServices.length > 0
      ? selectedServices.join(", ")
      : "Selected Services";

  const timelineLines = getServiceTimelineLines(selectedServices);

  const timelineSection =
    timelineLines.length > 0
      ? `What happens next:\n\n${timelineLines.join("\n")}\n\n`
      : "";

  const message = `Hi ${updatedRecord.fullName || "Sir/Madam"},

Thank you for choosing Conquest Techno Solutions.

We have received your additional payment successfully.

Business Name: ${updatedRecord.businessName}
Owner Name: ${updatedRecord.fullName || "N/A"}
Services Opted: ${serviceList}

Package Amount: ₹${Number(packageAmountNumber || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Payment Received Now: ₹${Number(additionalAmount || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Total Received Amount: ₹${Number(newTotalReceived || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Balance Amount: ₹${Number(balanceAmount || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 0
})}
Payment Status: ${paymentStatus}
Transaction ID / Cheque Number: ${transactionValue}
Payment Date: ${paymentDate || "N/A"}

${timelineSection}If you have any queries, feel free to connect with us.

Email: info@conquesttechnosolutions.com
Mobile: 7094090508

Thanks & Regards  
Conquest Techno Solutions`;

  await sendEmail(
    updatedRecord.email,
    "Payment Received - Conquest Techno Solutions",
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

      const requestType =
        approvalRequest.requestType || "DUPLICATE_TRANSACTION";

      // =====================================
      // ADDITIONAL PAYMENT UNDERPAYMENT APPROVAL
      // =====================================
      if (requestType === "UNDERPAYMENT_ADDITIONAL_PAYMENT") {
        const formData = approvalRequest.formData || {};

        const existingRecord = await FormDetail.findById(
          approvalRequest.existingFormId
        );

        if (!existingRecord) {
          return res.status(404).json({
            message: "Original form record not found"
          });
        }

        const transactionValue =
          formData.transactionIdOrChequeNumber?.trim();

        if (!transactionValue) {
          return res.status(400).json({
            message: "Transaction ID / Cheque number is missing"
          });
        }

        const additionalAmount = Number(formData.revenue || 0);

        if (Number.isNaN(additionalAmount) || additionalAmount <= 0) {
          return res.status(400).json({
            message: "Additional payment amount is invalid"
          });
        }

        const packageAmountNumber = Number(
          formData.packageAmount ||
            existingRecord.packageAmount ||
            existingRecord.revenue ||
            0
        );

        const alreadyReceived = Number(
          existingRecord.totalReceivedAmount ||
            existingRecord.revenue ||
            0
        );

        const newTotalReceived = alreadyReceived + additionalAmount;

        if (newTotalReceived > packageAmountNumber) {
          return res.status(400).json({
            message:
              "Total received amount cannot be greater than package amount"
          });
        }

        const balanceAmount = Number(
  Math.max(packageAmountNumber - newTotalReceived, 0).toFixed(2)
);

const closeBalance = Boolean(req.body.closeBalance);

const finalBalanceAmount = closeBalance ? 0 : balanceAmount;

const paymentStatus =
  closeBalance || finalBalanceAmount === 0 ? "Paid" : "Partially Paid";

const balanceClosedAmount = closeBalance ? balanceAmount : 0;

const totalExGst = Number((newTotalReceived / 1.18).toFixed(2));

        const mergedGoogleServices = mergeUnique(
          existingRecord.googleServices || [],
          Array.isArray(formData.googleServices)
            ? formData.googleServices
            : []
        );

        const mergedOtherServices = mergeUnique(
          existingRecord.otherServices || [],
          Array.isArray(formData.otherServices)
            ? formData.otherServices
            : []
        );

        let totalProfitSharing = 0;

        if (
          existingRecord.serviceCategory === "googleServices" ||
          formData.serviceCategory === "googleServices"
        ) {
          totalProfitSharing = Number((totalExGst * 0.3).toFixed(2));
        } else {
          totalProfitSharing = Number((totalExGst * 0.15).toFixed(2));
        }

        const paymentEntry = {
          paymentDate: formData.date || "",
          amount: additionalAmount,
          transactionIdOrChequeNumber: transactionValue,
          paymentDetails: formData.paymentDetails || "",
          paymentDetailsOther:
            formData.paymentDetails === "Other"
              ? formData.paymentDetailsOther || ""
              : "",
          googleServices: Array.isArray(formData.googleServices)
            ? formData.googleServices
            : [],
          googleServicesOther: formData.googleServicesOther || "",
          otherServices: Array.isArray(formData.otherServices)
            ? formData.otherServices
            : [],
          otherServicesOther: formData.otherServicesOther || ""
        };

        const updatedRecord = await FormDetail.findByIdAndUpdate(
          existingRecord._id,
          {
            $set: {
              revenue: newTotalReceived,
              exGst: totalExGst,
              profitSharing: totalProfitSharing,
              packageAmount: packageAmountNumber,
totalReceivedAmount: newTotalReceived,
balanceAmount: finalBalanceAmount,
paymentStatus,

isBalanceClosedByAdmin: closeBalance,
balanceClosedAmount,
balanceClosedApprovalRequestId: closeBalance ? approvalRequest._id : null,
balanceClosedBy: closeBalance ? req.user.id : null,
balanceClosedAt: closeBalance ? new Date() : null,

googleServices: mergedGoogleServices,
              googleServicesOther:
                formData.googleServicesOther ||
                existingRecord.googleServicesOther ||
                "",
              otherServices: mergedOtherServices,
              otherServicesOther:
                formData.otherServicesOther ||
                existingRecord.otherServicesOther ||
                ""
            },
            $push: {
              paymentHistory: paymentEntry
            }
          },
          { new: true }
        );

        approvalRequest.status = "APPROVED";
        approvalRequest.approvedBy = req.user.id;
        approvalRequest.approvedAt = new Date();
        approvalRequest.adminComment = req.body.adminComment || "";
        approvalRequest.savedFormId = updatedRecord._id;

        await approvalRequest.save();

        try {
          await sendAdditionalPaymentEmail({
  updatedRecord,
  packageAmountNumber,
  additionalAmount,
  newTotalReceived,
  balanceAmount: finalBalanceAmount,
  paymentStatus,
  transactionValue,
  paymentDate: formData.date || ""
});
        } catch (emailError) {
          console.error(
            "Approved additional payment email failed:",
            emailError.message
          );
        }

        return res.status(200).json({
          message: "Approved successfully. Additional payment saved.",
          data: updatedRecord
        });
      }

      // =====================================
      // DEFAULT: DUPLICATE TRANSACTION APPROVAL
      // =====================================
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