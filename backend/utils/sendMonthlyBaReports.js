import EmployeeDetail from "../models/EmployeeDetail.js";
import TmcLog from "../models/TmcLog.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import sendEmail from "./sendEmail.js";
import fs from "fs";
import { generateMonthlyReportPdf } from "./generateMonthlyReportPdf.js";
import { getRevenueBreakupByPaymentDate } from "./revenueByPaymentDate.js";

const getPreviousMonth = () => {
  const now = new Date();

  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();

  return `${year}-${String(month).padStart(2, "0")}`;
};

export const sendMonthlyBaReports = async () => {
  const monthString = getPreviousMonth();

  const activeBas = await EmployeeDetail.find({
    role: "ba",
    $or: [{ status: "active" }, { status: { $exists: false } }]
  }).populate("userId", "email name");

  console.log("================================");
  console.log("Active BA Count:", activeBas.length);
  console.log("================================");

  for (const ba of activeBas) {
    const baEmail = ba.userId?.email;

    console.log(
      "Checking BA:",
      ba.name,
      "| Email:",
      baEmail,
      "| UserId:",
      ba.userId?._id
    );

    if (!ba.userId?._id || !baEmail) {
      console.log("Skipped BA because email or userId missing:", ba.name);
      continue;
    }

    const tmcLogs = await TmcLog.find({
      userId: ba.userId._id,
      date: { $regex: `^${monthString}` }
    });

    const presentationsData = await PresentationDetail.find({
      userId: ba.userId._id,
      date: { $regex: `^${monthString}` }
    });

    const formsData = await FormDetail.find({
      userId: ba.userId._id,
      date: { $regex: `^${monthString}` }
    });

    const calls = tmcLogs.reduce(
      (sum, item) => sum + (item.calls?.length || 0),
      0
    );

    const presentations = tmcLogs.reduce(
      (sum, item) => sum + (item.presentations?.length || 0),
      0
    );

    const appointmentFixed = presentationsData.filter(
      (item) => item.isAppointment === true
    ).length;

    const appointmentVisited = await PresentationDetail.countDocuments({
      userId: ba.userId._id,
      isVisitedAppointment: true,
      visitedDate: { $regex: `^${monthString}` }
    });

    const forms = formsData.length;

    const revenueBreakup = await getRevenueBreakupByPaymentDate({
     userId: ba.userId._id,
     monthPrefix: monthString
    });

const revenue =
  revenueBreakup.exGst;

const profitSharing =
  revenueBreakup.profitSharing;

    const body = `
Dear ${ba.name},

Please find attached your Monthly Performance & Earnings Statement for ${monthString}.

Regards,
Conquest Techno Solutions
`;

    const pdfPath = await generateMonthlyReportPdf({
      employeeName: ba.name,
      month: monthString,
      calls,
      presentations,
      appointmentFixed,
      appointmentVisited,
      forms,
      revenue,
      profitSharing
    });

    console.log("Sending email to:", ba.name, baEmail);

    await sendEmail(
      baEmail,
      `Monthly Performance & Earnings Statement - ${monthString}`,
      body,
      [
        {
          filename: `${ba.name.replace(/\s+/g, "_")}_${monthString}.pdf`,
          path: pdfPath
        }
      ]
    );

    console.log("Email sent successfully to:", ba.name, baEmail);

    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  }

  console.log(`Monthly BA reports sent for ${monthString}`);
};