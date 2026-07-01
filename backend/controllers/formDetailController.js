import FormDetail from "../models/FormDetail.js";
import FormApprovalRequest from "../models/FormApprovalRequest.js";
import EmployeeDetail from "../models/EmployeeDetail.js";
import sendEmail from "../utils/sendEmail.js";

// =============================
// 🔥 SERVICE TIMELINE LOGIC
// =============================
const getServiceTimelineLines = (services = []) => {
  const lines = [];
  const lowerServices = services.map((s) => s.toLowerCase());

  // PHOTOSHOOT
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

  // OPTIMIZATION
  if (lowerServices.some((s) => s.includes("optimiz"))) {
    lines.push(
      "The optimization process will be completed within 20-25 working days."
    );
  }

  // CONTACT NUMBER
  if (lowerServices.some((s) => s.includes("contact"))) {
    lines.push(
      "The contact number update process will be completed within 21 working days."
    );
  }

  return lines;
};

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getExactCaseInsensitiveRegex = (value = "") => {
  return new RegExp(`^${escapeRegex(value.trim())}$`, "i");
};

export const getFormDetailsByMonth = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const records = await FormDetail.find({
      userId: req.user.id,
      date: { $regex: `^${month}` }
    }).sort({ date: -1, createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error("getFormDetailsByMonth error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveFormDetail = async (req, res) => {
  try {
    const {
      date,
      email,
      revenue,
      pincode,
      city,
      area,
      businessName,
      mobileNumber,
      fullName,
      address,
      gstNumber,
      gstInvoiceName,
      typeOfBusiness,
      typeOfBusinessOther,
      googleMapLink,
      transactionIdOrChequeNumber,
      paymentDetails,
      paymentDetailsOther,
      serviceCategory,
      googleServices,
      googleServicesOther,
      otherServices,
      otherServicesOther
    } = req.body;

    if (!date || !businessName || revenue === undefined || revenue === "") {
      return res.status(400).json({
        message: "Date, business name and revenue are required"
      });
    }

    const transactionValue = transactionIdOrChequeNumber?.trim();

    if (!transactionValue) {
      return res.status(400).json({
        message: "Transaction ID / Cheque number is required"
      });
    }

    if (!serviceCategory) {
      return res.status(400).json({
        message: "Service category is required"
      });
    }

    if (
      serviceCategory !== "googleServices" &&
      serviceCategory !== "otherServices"
    ) {
      return res.status(400).json({
        message: "Invalid service category"
      });
    }

    const revenueNumber = Number(revenue);

    if (Number.isNaN(revenueNumber) || revenueNumber < 0) {
      return res.status(400).json({
        message: "Revenue must be a valid positive number"
      });
    }

    const exGst = Number((revenueNumber / 1.18).toFixed(2));

    let profitSharing = 0;
    if (serviceCategory === "googleServices") {
      profitSharing = Number((exGst * 0.3).toFixed(2));
    } else {
      profitSharing = Number((exGst * 0.15).toFixed(2));
    }

    let finalGoogleServices = Array.isArray(googleServices) ? googleServices : [];
    let finalGoogleServicesOther = "";
    let finalOtherServices = Array.isArray(otherServices) ? otherServices : [];
    let finalOtherServicesOther = "";

    if (serviceCategory === "googleServices") {
      if (finalGoogleServices.length === 0) {
        return res.status(400).json({
          message: "Please select at least one Google service"
        });
      }

      finalGoogleServicesOther = finalGoogleServices.includes("Others")
        ? googleServicesOther || ""
        : "";

      finalOtherServices = [];
      finalOtherServicesOther = "";
    }

    if (serviceCategory === "otherServices") {
      if (finalOtherServices.length === 0) {
        return res.status(400).json({
          message: "Please select at least one Other service"
        });
      }

      finalOtherServicesOther = finalOtherServices.includes("Other Services")
        ? otherServicesOther || ""
        : "";

      finalGoogleServices = [];
      finalGoogleServicesOther = "";
    }

    const employeeProfile = await EmployeeDetail.findOne({
      userId: req.user.id
    });

    const recordPayload = {
      userId: req.user.id,
      date,
      email: email || "",
      revenue: revenueNumber,
      exGst,
      profitSharing,
      pincode: pincode || "",
      city: city || "",
      area: area || "",
      baName: employeeProfile?.name || "",
      baId: employeeProfile?.employeeId || "",
      businessName: businessName || "",
      mobileNumber: mobileNumber || "",
      fullName: fullName || "",
      address: address || "",
      gstNumber: gstNumber || "",
      gstInvoiceName: gstInvoiceName || "",
      typeOfBusiness: typeOfBusiness || "",
      typeOfBusinessOther:
        typeOfBusiness === "Other" ? typeOfBusinessOther || "" : "",
      googleMapLink: googleMapLink || "",
      transactionIdOrChequeNumber: transactionValue,
      paymentDetails: paymentDetails || "",
      paymentDetailsOther:
        paymentDetails === "Other" ? paymentDetailsOther || "" : "",
      serviceCategory,
      googleServices: finalGoogleServices,
      googleServicesOther: finalGoogleServicesOther,
      otherServices: finalOtherServices,
      otherServicesOther: finalOtherServicesOther
    };

    // =============================
    // 🔒 DUPLICATE TRANSACTION CHECK
    // =============================
    const duplicateRecord = await FormDetail.findOne({
      transactionIdOrChequeNumber: getExactCaseInsensitiveRegex(transactionValue)
    }).select(
      "_id date businessName baName baId revenue transactionIdOrChequeNumber paymentDetails createdAt"
    );

    if (duplicateRecord) {
      const transactionKey = transactionValue.toUpperCase();

      const existingPendingRequest = await FormApprovalRequest.findOne({
        transactionKey,
        requestedBy: req.user.id,
        status: "PENDING",
        "formData.businessName": recordPayload.businessName,
        "formData.mobileNumber": recordPayload.mobileNumber,
        "formData.revenue": recordPayload.revenue
      });

      if (existingPendingRequest) {
        return res.status(202).json({
          requiresAdminApproval: true,
          message:
            "This Transaction ID / Cheque Number is already pending for admin approval."
        });
      }

      await FormApprovalRequest.create({
        transactionIdOrChequeNumber: transactionValue,
        transactionKey,
        existingFormId: duplicateRecord._id,
        existingFormSnapshot: {
          _id: duplicateRecord._id,
          date: duplicateRecord.date,
          businessName: duplicateRecord.businessName,
          baName: duplicateRecord.baName,
          baId: duplicateRecord.baId,
          revenue: duplicateRecord.revenue,
          transactionIdOrChequeNumber:
            duplicateRecord.transactionIdOrChequeNumber,
          paymentDetails: duplicateRecord.paymentDetails,
          createdAt: duplicateRecord.createdAt
        },
        formData: recordPayload,
        requestedBy: req.user.id,
        requestedByName: employeeProfile?.name || "",
        requestedByEmployeeId: employeeProfile?.employeeId || "",
        status: "PENDING"
      });

      return res.status(202).json({
        requiresAdminApproval: true,
        message:
          "This Transaction ID / Cheque Number already exists. Request sent to admin approval."
      });
    }

    const newRecord = await FormDetail.create(recordPayload);

    // =============================
    // 📧 SEND EMAIL TO CUSTOMER
    // =============================
    try {
      if (newRecord.email) {
        const selectedServices = [
          ...finalGoogleServices,
          ...(finalGoogleServicesOther ? [finalGoogleServicesOther] : []),
          ...finalOtherServices,
          ...(finalOtherServicesOther ? [finalOtherServicesOther] : [])
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
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    res.status(201).json({
      message: "Form details saved successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("saveFormDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateFormDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const revenueNumber = Number(req.body.revenue || 0);
    const exGst = Number((revenueNumber / 1.18).toFixed(2));

    let profitSharing = 0;
    if (req.body.serviceCategory === "googleServices") {
      profitSharing = Number((exGst * 0.3).toFixed(2));
    } else {
      profitSharing = Number((exGst * 0.15).toFixed(2));
    }

    const updatedRecord = await FormDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id
      },
      {
        ...req.body,
        revenue: revenueNumber,
        exGst,
        profitSharing
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Form record not found" });
    }

    res.status(200).json({
      message: "Form updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("updateFormDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteFormDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await FormDetail.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!deletedRecord) {
      return res.status(404).json({ message: "Form record not found" });
    }

    res.status(200).json({
      message: "Form record deleted successfully"
    });
  } catch (error) {
    console.error("deleteFormDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};