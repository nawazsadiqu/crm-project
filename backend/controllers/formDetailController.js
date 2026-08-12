import FormDetail from "../models/FormDetail.js";
import FormApprovalRequest from "../models/FormApprovalRequest.js";
import EmployeeDetail from "../models/EmployeeDetail.js";
import sendEmail from "../utils/sendEmail.js";
import {encryptCredential} from "../utils/credentialEncryption.js";

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

const ACCESS_REQUIRED_GOOGLE_SERVICES = [
  "GMB Profile",
  "Suspended Page",
  "Contact Number",
];

const requiresGoogleAccess = (
  serviceCategory,
  googleServices = []
) => {
  if (
    serviceCategory !== "googleServices"
  ) {
    return false;
  }

  return ACCESS_REQUIRED_GOOGLE_SERVICES.some(
    (service) =>
      googleServices.includes(service)
  );
};

export const getFormDetailsByMonth = async (
  req,
  res
) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        message: "Month is required"
      });
    }

    /*
      Return forms when either:

      1. The original payment was made
         during the selected month.

      2. An additional installment was
         made during the selected month.
    */
    const records =
      await FormDetail.find({
        userId: req.user.id,

        $or: [
          {
            date: {
              $regex: `^${month}`
            }
          },
          {
            "paymentHistory.paymentDate": {
              $regex: `^${month}`
            }
          }
        ]
      })
        .select("+accessPasswordEncrypted")
        .sort({
          date: -1,
          createdAt: -1
        })
        .lean();

    const monthlyRecords = records.map(
      (record) => {
        /*
          First/original payment belongs to
          the month stored in record.date.
        */
        const originalPaymentAmount =
          String(record.date || "").startsWith(
            month
          )
            ? Number(
                record.amountReceivedNow ||
                  record.revenue ||
                  0
              )
            : 0;

        /*
          Only installments whose paymentDate
          belongs to the selected month.
        */
        const monthlyPaymentHistory =
          Array.isArray(
            record.paymentHistory
          )
            ? record.paymentHistory.filter(
                (payment) =>
                  String(
                    payment.paymentDate || ""
                  ).startsWith(month)
              )
            : [];

        const additionalPaymentAmount =
          monthlyPaymentHistory.reduce(
            (sum, payment) =>
              sum +
              Number(
                payment.amount || 0
              ),
            0
          );

        const monthlyRevenue =
          originalPaymentAmount +
          additionalPaymentAmount;

        const monthlyExGst = Number(
          (
            monthlyRevenue / 1.18
          ).toFixed(2)
        );

        const profitPercentage =
          record.serviceCategory ===
          "googleServices"
            ? 0.3
            : 0.20;

        const monthlyProfitSharing =
          Number(
            (
              monthlyExGst *
              profitPercentage
            ).toFixed(2)
          );

        const {
          accessPasswordEncrypted,
          ...safeRecord
        } = record;

        return {
          ...safeRecord,

          hasAccessPassword:
            Boolean(accessPasswordEncrypted),

          /*
            These values are only for the
            selected month's totals.
          */
          monthlyRevenue,

          monthlyExGst,

          monthlyProfitSharing,

          monthlyPaymentHistory
        };
      }
    );

    res.status(200).json(
      monthlyRecords
    );
  } catch (error) {
    console.error(
      "getFormDetailsByMonth error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

export const saveFormDetail = async (req, res) => {
  try {
    const {
      date,
      email,
      accessEmail,
      accessPassword,
      revenue,
      paymentType,
      packageAmount,
      parentFormId,
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

    if (Number.isNaN(revenueNumber) || revenueNumber <= 0) {
      return res.status(400).json({
        message: "Payment received amount must be a valid positive number"
      });
    }

    const finalPaymentType = parentFormId
      ? "additional"
      : paymentType === "partial"
      ? "partial"
      : "complete";

    let packageAmountNumber =
      finalPaymentType === "complete"
        ? revenueNumber
        : Number(packageAmount || 0);

    let parentFormObjectId = null;
    let paymentGroupObjectId = null;
    let totalReceivedBefore = 0;
    let paymentSequence = 1;

    if (finalPaymentType === "additional") {
      const parentForm = await FormDetail.findOne({
        _id: parentFormId,
        userId: req.user.id
      });

      if (!parentForm) {
        return res.status(404).json({
          message: "Original partial payment form not found"
        });
      }

      const groupId = parentForm.paymentGroupId || parentForm._id;

      const existingPayments = await FormDetail.find({
        userId: req.user.id,
        $or: [{ _id: groupId }, { parentFormId: groupId }]
      });

      totalReceivedBefore = existingPayments.reduce(
        (sum, item) => sum + Number(item.amountReceivedNow || item.revenue || 0),
        0
      );

      packageAmountNumber = Number(
        packageAmount || parentForm.packageAmount || parentForm.revenue || 0
      );

      parentFormObjectId = groupId;
      paymentGroupObjectId = groupId;
      paymentSequence = existingPayments.length + 1;
    }

    if (finalPaymentType === "partial" || finalPaymentType === "additional") {
      if (
        Number.isNaN(packageAmountNumber) ||
        packageAmountNumber <= 0
      ) {
        return res.status(400).json({
          message: "Package amount is required for partial/additional payment"
        });
      }

      if (packageAmountNumber < totalReceivedBefore + revenueNumber) {
        return res.status(400).json({
          message:
            "Package amount cannot be less than total received amount"
        });
      }
    }

    const totalReceivedAmount = totalReceivedBefore + revenueNumber;
    const balanceAmount = Number(
      Math.max(packageAmountNumber - totalReceivedAmount, 0).toFixed(2)
    );

    const paymentStatus =
      balanceAmount > 0 ? "Partially Paid" : "Paid";
      
    const exGst = Number((revenueNumber / 1.18).toFixed(2));

    let profitSharing = 0;
    if (serviceCategory === "googleServices") {
      profitSharing = Number((exGst * 0.3).toFixed(2));
    } else {
      profitSharing = Number((exGst * 0.20).toFixed(2));
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

    const accessRequired =
      requiresGoogleAccess(
        serviceCategory,
        finalGoogleServices
      );

    const finalAccessEmail =
     String(accessEmail || "").trim();

    const finalAccessPassword =
      String(accessPassword || "");

    if (accessRequired) {
      if (!finalAccessEmail) {
        return res.status(400).json({
          message:
            "Access email ID is required for the selected Google service"
        });
      }

      if (!finalAccessPassword) {
        return res.status(400).json({
          message:
            "Access password is required for the selected Google service"
        });
      }
    }

    const employeeProfile = await EmployeeDetail.findOne({
      userId: req.user.id
    });

    const recordPayload = {
      userId: req.user.id,
      date,
      email: email || "",
      accessEmail:
        accessRequired
          ? finalAccessEmail
          : "",

      accessPasswordEncrypted:
        accessRequired
          ? encryptCredential(
              finalAccessPassword
            )
          : "",
      revenue: revenueNumber,
      exGst,
      profitSharing,
      paymentType: finalPaymentType,
      packageAmount: packageAmountNumber,
      amountReceivedNow: revenueNumber,
      totalReceivedAmount,
      balanceAmount,
      paymentStatus,
      parentFormId: parentFormObjectId,
      paymentGroupId: paymentGroupObjectId,
      paymentSequence,
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
        requestType: "DUPLICATE_TRANSACTION",
        approvalReason: "Duplicate Transaction ID / Cheque Number found.",
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

    if (!paymentGroupObjectId) {
  newRecord.paymentGroupId = newRecord._id;
  await newRecord.save();
}

if (paymentGroupObjectId) {
  await FormDetail.updateMany(
    {
      userId: req.user.id,
      $or: [{ _id: paymentGroupObjectId }, { parentFormId: paymentGroupObjectId }]
    },
    {
      packageAmount: packageAmountNumber,
      balanceAmount,
      paymentStatus
    }
  );
}

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
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    const safeNewRecord =
  newRecord.toObject();

delete safeNewRecord.accessPasswordEncrypted;

safeNewRecord.hasAccessPassword =
  Boolean(
    newRecord.accessPasswordEncrypted
  );

res.status(201).json({
  message: "Form details saved successfully",
  data: safeNewRecord
});
  } catch (error) {
    console.error("saveFormDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateFormDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // =====================================
    // ADD PAYMENT: update same form record
    // =====================================
    if (req.body.paymentType === "additional") {
      const existingRecord = await FormDetail.findOne({
        _id: id,
        userId: req.user.id
      }).select("+accessPasswordEncrypted");

      if (!existingRecord) {
        return res.status(404).json({ message: "Form record not found" });
      }

      const transactionValue = req.body.transactionIdOrChequeNumber?.trim();

      if (!transactionValue) {
        return res.status(400).json({
          message: "Transaction ID / Cheque number is required"
        });
      }

      const additionalAmount = Number(req.body.revenue || 0);

      if (Number.isNaN(additionalAmount) || additionalAmount <= 0) {
        return res.status(400).json({
          message: "Payment received amount must be greater than 0"
        });
      }

      const packageAmountNumber = Number(
        req.body.packageAmount ||
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
          message: "Total received amount cannot be greater than package amount"
        });
      }

      // =====================================
      // DUPLICATE TRANSACTION CHECK
      // Checks:
      // 1. Main transactionIdOrChequeNumber
      // 2. paymentHistory transaction IDs
      // =====================================
      const duplicateTransaction = await FormDetail.findOne({
        $or: [
          {
            transactionIdOrChequeNumber:
              getExactCaseInsensitiveRegex(transactionValue)
          },
          {
            "paymentHistory.transactionIdOrChequeNumber":
              getExactCaseInsensitiveRegex(transactionValue)
          }
        ]
      }).select("_id businessName transactionIdOrChequeNumber paymentHistory");

      if (duplicateTransaction) {
        return res.status(400).json({
          message:
            "This Transaction ID / Cheque Number already exists. Please check and enter a different transaction ID."
        });
      }

      const balanceAmount = Number(
  Math.max(packageAmountNumber - newTotalReceived, 0).toFixed(2)
);

const paymentStatus = balanceAmount > 0 ? "Partially Paid" : "Paid";

// =====================================
// UNDERPAYMENT APPROVAL CHECK
// Additional payment still has balance
// =====================================
if (balanceAmount > 0) {
  const transactionKey = `UNDERPAYMENT-ADDITIONAL-${existingRecord._id}-${transactionValue.toUpperCase()}`;

  const existingPendingRequest = await FormApprovalRequest.findOne({
    transactionKey,
    requestedBy: req.user.id,
    status: "PENDING",
    requestType: "UNDERPAYMENT_ADDITIONAL_PAYMENT"
  });

  if (existingPendingRequest) {
    return res.status(202).json({
      requiresAdminApproval: true,
      message:
        "This additional payment is already pending for admin approval."
    });
  }

  const safeApprovalFormData = {
  ...req.body
};

delete safeApprovalFormData.accessPassword;
delete safeApprovalFormData.hasAccessPassword;
delete safeApprovalFormData.accessPasswordEncrypted;

  await FormApprovalRequest.create({
    requestType: "UNDERPAYMENT_ADDITIONAL_PAYMENT",
    approvalReason: `Additional payment received, but balance amount ₹${balanceAmount} is still pending.`,
    transactionIdOrChequeNumber: transactionValue,
    transactionKey,
    existingFormId: existingRecord._id,
    parentFormId: existingRecord._id,
    existingFormSnapshot: {
      _id: existingRecord._id,
      date: existingRecord.date,
      businessName: existingRecord.businessName,
      baName: existingRecord.baName,
      baId: existingRecord.baId,
      revenue: existingRecord.revenue,
      packageAmount: existingRecord.packageAmount,
      totalReceivedAmount: existingRecord.totalReceivedAmount,
      balanceAmount: existingRecord.balanceAmount,
      paymentStatus: existingRecord.paymentStatus,
      transactionIdOrChequeNumber:
        existingRecord.transactionIdOrChequeNumber,
      paymentDetails: existingRecord.paymentDetails,
      createdAt: existingRecord.createdAt
    },
    formData: {
      ...safeApprovalFormData,
      date: req.body.date || "",
      revenue: additionalAmount,
      packageAmount: packageAmountNumber,
      newTotalReceived,
      balanceAmount,
      paymentStatus,
      transactionIdOrChequeNumber: transactionValue
    },
    requestedBy: req.user.id,
    requestedByName: existingRecord.baName || "",
    requestedByEmployeeId: existingRecord.baId || "",
    status: "PENDING"
  });

  return res.status(202).json({
    requiresAdminApproval: true,
    message:
      "Additional payment still has balance amount pending. Request sent to admin approval."
  });
}

const totalExGst = Number((newTotalReceived / 1.18).toFixed(2));

      const mergedGoogleServices = mergeUnique(
        existingRecord.googleServices || [],
        Array.isArray(req.body.googleServices) ? req.body.googleServices : []
      );

      const mergedOtherServices = mergeUnique(
        existingRecord.otherServices || [],
        Array.isArray(req.body.otherServices) ? req.body.otherServices : []
      );

      const additionalAccessRequired = requiresGoogleAccess(
        req.body.serviceCategory ||
          existingRecord.serviceCategory,
        mergedGoogleServices
      );

      const additionalAccessEmail = String(
        req.body.accessEmail ||
        existingRecord.accessEmail ||
        ""
      ).trim();

      const additionalAccessPassword = String(req.body.accessPassword || "");

        if (
          additionalAccessRequired &&
          !additionalAccessEmail
        ) {
          return res.status(400).json({
            message:
              "Access email ID is required for the selected Google service"
          });
        }

        if (
          additionalAccessRequired &&
          !additionalAccessPassword &&
          !existingRecord.accessPasswordEncrypted
        ) {
        return res.status(400).json({
           message:
            "Access password is required for the selected Google service"
        });
        }

      let totalProfitSharing = 0;

      if (
        existingRecord.serviceCategory === "googleServices" ||
        req.body.serviceCategory === "googleServices"
      ) {
        totalProfitSharing = Number((totalExGst * 0.3).toFixed(2));
      } else {
        totalProfitSharing = Number((totalExGst * 0.20).toFixed(2));
      }

      const paymentEntry = {
        paymentDate: req.body.date || "",
        amount: additionalAmount,
        transactionIdOrChequeNumber: transactionValue,
        paymentDetails: req.body.paymentDetails || "",
        paymentDetailsOther:
          req.body.paymentDetails === "Other"
            ? req.body.paymentDetailsOther || ""
            : "",
        googleServices: Array.isArray(req.body.googleServices)
          ? req.body.googleServices
          : [],
        googleServicesOther: req.body.googleServicesOther || "",
        otherServices: Array.isArray(req.body.otherServices)
          ? req.body.otherServices
          : [],
        otherServicesOther: req.body.otherServicesOther || ""
      };

      const updatedRecord = await FormDetail.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id
        },
        {
          $set: {
            revenue: newTotalReceived,
            exGst: totalExGst,
            profitSharing: totalProfitSharing,

            packageAmount: packageAmountNumber,
            totalReceivedAmount: newTotalReceived,
            balanceAmount,
            paymentStatus,

            accessEmail:
              additionalAccessRequired
              ? additionalAccessEmail
              : "",

            accessPasswordEncrypted:
              additionalAccessRequired
              ? additionalAccessPassword
                ? encryptCredential(
                additionalAccessPassword
                )
              : existingRecord
              .accessPasswordEncrypted
              : "",

            googleServices: mergedGoogleServices,
            googleServicesOther:
              req.body.googleServicesOther ||
              existingRecord.googleServicesOther ||
              "",

            otherServices: mergedOtherServices,
            otherServicesOther:
              req.body.otherServicesOther ||
              existingRecord.otherServicesOther ||
              ""
          },
          $push: {
            paymentHistory: paymentEntry
          }
        },
        { new: true }
      );

      // =====================================
      // SEND EMAIL FOR ADDITIONAL PAYMENT
      // =====================================
      try {
        if (updatedRecord.email) {
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
Payment Date: ${req.body.date || "N/A"}

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
        }
      } catch (emailError) {
        console.error("Additional payment email failed:", emailError.message);
      }

      return res.status(200).json({
        message: "Payment added successfully",
        data: updatedRecord
      });
    }

    // =====================================
// NORMAL EDIT FORM
// =====================================
const existingRecord =
  await FormDetail.findOne({
    _id: id,
    userId: req.user.id
  }).select(
    "+accessPasswordEncrypted"
  );

if (!existingRecord) {
  return res.status(404).json({
    message: "Form record not found"
  });
}

const editServiceCategory =
  req.body.serviceCategory ||
  existingRecord.serviceCategory;

const editGoogleServices =
  Array.isArray(
    req.body.googleServices
  )
    ? req.body.googleServices
    : existingRecord.googleServices || [];

const accessRequired =
  requiresGoogleAccess(
    editServiceCategory,
    editGoogleServices
  );

const accessEmail =
  String(
    req.body.accessEmail || ""
  ).trim();

const newAccessPassword =
  String(
    req.body.accessPassword || ""
  );

if (accessRequired && !accessEmail) {
  return res.status(400).json({
    message:
      "Access email ID is required for the selected Google service"
  });
}

if (
  accessRequired &&
  !newAccessPassword &&
  !existingRecord.accessPasswordEncrypted
) {
  return res.status(400).json({
    message:
      "Access password is required for the selected Google service"
  });
}

const revenueNumber = Number(
  req.body.revenue || 0
);

if (
  Number.isNaN(revenueNumber) ||
  revenueNumber < 0
) {
  return res.status(400).json({
    message: "Invalid received amount"
  });
}

const paymentType =
  req.body.paymentType === "partial"
    ? "partial"
    : "complete";

const packageAmountNumber =
  paymentType === "complete"
    ? revenueNumber
    : Number(req.body.packageAmount || 0);

if (
  paymentType === "partial" &&
  (
    Number.isNaN(packageAmountNumber) ||
    packageAmountNumber <= 0
  )
) {
  return res.status(400).json({
    message:
      "Package amount is required for partial payment"
  });
}

if (
  paymentType === "partial" &&
  packageAmountNumber < revenueNumber
) {
  return res.status(400).json({
    message:
      "Package amount cannot be less than the received amount"
  });
}

const totalReceivedAmount =
  revenueNumber;

const balanceAmount = Number(
  Math.max(
    packageAmountNumber -
      totalReceivedAmount,
    0
  ).toFixed(2)
);

const paymentStatus =
  balanceAmount > 0
    ? "Partially Paid"
    : "Paid";

const exGst = Number(
  (
    totalReceivedAmount / 1.18
  ).toFixed(2)
);

let profitSharing = 0;

if (
  req.body.serviceCategory ===
  "googleServices"
) {
  profitSharing = Number(
    (exGst * 0.3).toFixed(2)
  );
} else {
  profitSharing = Number(
    (exGst * 0.20).toFixed(2)
  );
}

// Remove empty ObjectId fields before updating
const safeUpdateBody = {
  ...req.body
};

delete safeUpdateBody.accessPassword;
delete safeUpdateBody.hasAccessPassword;
delete safeUpdateBody.accessPasswordEncrypted;

[
  "parentFormId",
  "paymentGroupId",
  "balanceClosedApprovalRequestId",
  "balanceClosedBy",
  "duplicateTransactionApprovalRequestId",
  "duplicateTransactionApprovedBy"
].forEach((field) => {
  if (safeUpdateBody[field] === "") {
    delete safeUpdateBody[field];
  }
});

const updatedRecord =
  await FormDetail.findOneAndUpdate(
    {
      _id: id,
      userId: req.user.id
    },
    {
      $set: {
        ...safeUpdateBody,

        accessEmail:
          accessRequired
          ? accessEmail
          : "",

        accessPasswordEncrypted:
          accessRequired
          ? newAccessPassword
          ? encryptCredential(
            newAccessPassword
          )
          : existingRecord
              .accessPasswordEncrypted
          : "",

        paymentType,

        packageAmount:
          packageAmountNumber,

        revenue:
          totalReceivedAmount,

        totalReceivedAmount,

        balanceAmount,

        paymentStatus,

        exGst,

        profitSharing
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

if (!updatedRecord) {
  return res.status(404).json({
    message: "Form record not found"
  });
}

res.status(200).json({
  message:
    "Form updated successfully",
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