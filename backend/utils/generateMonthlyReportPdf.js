import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const formatMoney = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatMonth = (month) => {
  const [year, monthNum] = month.split("-");

  const monthName = new Date(
    Number(year),
    Number(monthNum) - 1
  ).toLocaleString("en-US", { month: "long" });

  return `${monthName} ${year}`;
};

const drawTable = (doc, startX, startY, headers, rows) => {
  const colWidths = [300, 180];
  const rowHeight = 28;

  let y = startY;

  doc.fontSize(11).font("Helvetica-Bold");

  headers.forEach((header, index) => {
    const x =
      startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0);

    doc.rect(x, y, colWidths[index], rowHeight).stroke();

    doc.text(header, x + 10, y + 8, {
      width: colWidths[index] - 20
    });
  });

  y += rowHeight;

  doc.font("Helvetica").fontSize(11);

  rows.forEach((row) => {
    row.forEach((cell, index) => {
      const x =
        startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0);

      doc.rect(x, y, colWidths[index], rowHeight).stroke();

      doc.text(String(cell), x + 10, y + 8, {
        width: colWidths[index] - 20
      });
    });

    y += rowHeight;
  });

  return y;
};

export const generateMonthlyReportPdf = async ({
  employeeName,
  month,
  calls,
  presentations,
  appointmentFixed,
  appointmentVisited,
  forms,
  revenue,
  profitSharing
}) => {
  const reportsDir = path.join(process.cwd(), "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const fileName = `${employeeName
    .replace(/\s+/g, "_")
    .toUpperCase()}_${month}.pdf`;

  const filePath = path.join(reportsDir, fileName);

  const logoPath = path.join(process.cwd(), "assets", "cts-logo.png");

  const doc = new PDFDocument({
    margin: 50
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Watermark logo
  if (fs.existsSync(logoPath)) {
    doc.save();

    doc.opacity(0.08);
    doc.image(logoPath, 170, 250, {
      width: 260
    });

    doc.opacity(1);
    doc.restore();
  }

  // Top-left logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 35, {
      width: 60
    });
  }

  // Header beside logo
  doc.font("Helvetica-Bold").fontSize(20).text(
    "CONQUEST TECHNO SOLUTIONS",
    115,
    45,
    {
      align: "center",
      width: 420
    }
  );

  doc.fontSize(15).text(
    "Monthly Performance & Earnings Statement",
    115,
    72,
    {
      align: "center",
      width: 420
    }
  );

  doc.y = 125;

  // Employee information
  doc.font("Helvetica").fontSize(12);

  const labelX = 50;
  const colonX = 175;
  const valueX = 190;

  doc.text("Employee Name", labelX, doc.y, {
    width: 120
  });
  doc.text(":", colonX, doc.y - 14);
  doc.text(employeeName, valueX, doc.y - 14);

  doc.moveDown();

  doc.text("Month", labelX, doc.y, {
    width: 120
  });
  doc.text(":", colonX, doc.y - 14);
  doc.text(formatMonth(month), valueX, doc.y - 14);

  doc.moveDown(3);

  // Performance Summary
  doc.font("Helvetica-Bold").fontSize(13).text("Performance Summary");
  doc.moveDown(0.7);

  let currentY = drawTable(
    doc,
    55,
    doc.y,
    ["Performance Metric", "Result"],
    [
      ["Calls Made", calls],
      ["Presentations Done", presentations],
      ["Appointments Fixed", appointmentFixed],
      ["Appointments Visited", appointmentVisited],
      ["Forms Closed", forms],
      ["Revenue Generated", formatMoney(revenue)]
    ]
  );

  doc.y = currentY + 30;

  // Earnings Summary
  doc.font("Helvetica-Bold").fontSize(13).text("Earnings Summary");
  doc.moveDown(0.7);

  currentY = drawTable(
    doc,
    55,
    doc.y,
    ["Earnings", "Amount"],
    [["Profit Sharing Earned", formatMoney(profitSharing)]]
  );

  doc.y = currentY + 45;

  // Footer
  doc.font("Helvetica").fontSize(10).text(
    "This is a system-generated report from Conquest Techno Solutions CRM.",
    {
      align: "center"
    }
  );

  doc.text(
    "For any clarification regarding calculations, please contact the HR Department.",
    {
      align: "center"
    }
  );

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};