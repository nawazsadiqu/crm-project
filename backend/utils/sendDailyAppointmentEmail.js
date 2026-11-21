
import ExcelJS from "exceljs";

import PresentationDetail from "../models/PresentationDetail.js";
import DailyAppointmentSnapshot from "../models/DailyAppointmentSnapshot.js";

import "../models/User.js";

import sendEmail from "./sendEmail.js";

/*
==========================================
DATE HELPERS
==========================================
*/

const getTodayIST = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).formatToParts(new Date());

  const get = (type) =>
    parts.find(
      (part) => part.type === type
    )?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const getTomorrowIST = () => {
  const [year, month, day] = getTodayIST()
    .split("-")
    .map(Number);

  const tomorrow = new Date(
    Date.UTC(year, month - 1, day + 1)
  );

  return tomorrow.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "";

  const [year, month, day] =
    String(value).split("-");

  return `${day}/${month}/${year}`;
};

const formatFileDate = (value) => {
  return String(value || "").replace(/\//g, "-");
};

/*
==========================================
HTML HELPERS
==========================================
*/

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getSafeMapLink = (value) => {
  const link = String(value || "").trim();

  try {
    const url = new URL(link);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return link;
    }

    return "";
  } catch {
    return "";
  }
};

/*
==========================================
APPOINTMENT TIME FORMAT
==========================================
*/

const formatAppointmentTime = (timeValue) => {
  if (
    timeValue === null ||
    timeValue === undefined ||
    timeValue === ""
  ) {
    return "Not set";
  }

  const raw = String(timeValue).trim();

  const match = raw.match(
    /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/
  );

  if (!match) {
    return raw;
  }

  const hour = Number(match[1]);
  const minute = match[2];

  const period =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
};


/*
==========================================
CREATE EXCEL ATTACHMENT
==========================================
*/

const createAppointmentExcel = async (
  appointments,
  displayDate
) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "CTS CONEXA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(
    "Tomorrow's Appointments"
  );

  /*
  TITLE
  */

  worksheet.mergeCells("A1:F1");

  const titleCell = worksheet.getCell("A1");

  titleCell.value =
    "CTS CONEXA - Tomorrow's Appointment Report";

  titleCell.font = {
    bold: true,
    size: 16,
    color: {
      argb: "FFFFFFFF"
    }
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF0F172A"
    }
  };

  titleCell.alignment = {
    vertical: "middle",
    horizontal: "center"
  };

  worksheet.getRow(1).height = 32;

  /*
  DATE & COUNT
  */

  worksheet.mergeCells("A2:F2");

  const dateCell = worksheet.getCell("A2");

  dateCell.value =
    `Appointment Date: ${displayDate} | ` +
    `Total Appointments: ${appointments.length}`;

  dateCell.font = {
    bold: true,
    size: 11
  };

  dateCell.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  worksheet.getRow(2).height = 24;

  worksheet.addRow([]);

  /*
  TABLE HEADER
  */

  const headers = [
    "Sl No",
    "Business Name",
    "BA Name",
    "Contact Number",
    "Appointment Time",
    "Map Link"
  ];

  const headerRow = worksheet.addRow(headers);

  headerRow.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF2563EB"
    }
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true
  };

  headerRow.height = 30;

  /*
  TABLE DATA
  */

  appointments.forEach((item, index) => {
    const mapLink = getSafeMapLink(
      item.mapLink
    );

    const row = worksheet.addRow([
      index + 1,
      item.businessName || "-",
      item.userId?.name || "-",
      item.contact || "-",
      formatAppointmentTime(item.appointmentTime),
      mapLink ? "Map Link" : "-"
    ]);

    /*
    Keep contact number as text.
    */

    row.getCell(4).numFmt = "@";

    /*
    Clickable Google Maps link.
    */

    if (mapLink) {
      const mapCell = row.getCell(6);

      mapCell.value = {
        text: "Map Link",
        hyperlink: mapLink
      };

      mapCell.font = {
        color: {
          argb: "FF2563EB"
        },
        underline: true
      };
    }

    row.alignment = {
      vertical: "middle",
      wrapText: true
    };

    row.height = 34;
  });

  /*
  COLUMN WIDTHS
  */

  const widths = [
    10,
    38,
    24,
    20,
    20,
    16
  ];

  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width =
      width;
  });

  /*
  CENTER SELECTED COLUMNS
  */

  [1, 4, 5, 6].forEach((column) => {
    worksheet.getColumn(column).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });

  /*
  BORDERS
  */

  for (
    let rowNumber = 4;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    worksheet.getRow(rowNumber).eachCell(
      {
        includeEmpty: true
      },
      (cell) => {
        cell.border = {
          top: {
            style: "thin",
            color: {
              argb: "FFE2E8F0"
            }
          },
          left: {
            style: "thin",
            color: {
              argb: "FFE2E8F0"
            }
          },
          bottom: {
            style: "thin",
            color: {
              argb: "FFE2E8F0"
            }
          },
          right: {
            style: "thin",
            color: {
              argb: "FFE2E8F0"
            }
          }
        };
      }
    );
  }

  /*
  FREEZE HEADER
  */

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 4
    }
  ];

  /*
  FILTERS
  */

  worksheet.autoFilter = {
    from: "A4",
    to: "F4"
  };

  /*
  RETURN EXCEL BUFFER
  */

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
};

/*
==========================================
SEND TOMORROW'S APPOINTMENT REPORT
==========================================
*/

export const sendDailyAppointmentEmail = async () => {
  /*
  EMAIL RECIPIENT
  */

  const recipient = String(
    process.env.DAILY_APPOINTMENT_EMAIL || ""
  ).trim();

  if (!recipient) {
    console.log(
      "DAILY_APPOINTMENT_EMAIL not configured"
    );

    return;
  }

  /*
  TOMORROW'S DATE IN IST
  */

  const tomorrow = getTomorrowIST();

  const displayDate =
    formatDisplayDate(tomorrow);

  /*
  FETCH TOMORROW'S FIXED APPOINTMENTS
  */

  const appointments =
    await PresentationDetail.find({
      appointmentDate: tomorrow,
      status: "Appointment Fixed"
    })
      .populate(
        "userId",
        "name email"
      )
      .populate(
        "assignedBaId",
        "name"
      )
      .sort({
        appointmentTime: 1,
        createdAt: 1
      })
      .lean();

  /*
  EMAIL SUBJECT
  */

  const subject =
    `CTS - Tomorrow's Appointments (${displayDate})`;

  /*
  PLAIN TEXT FALLBACK
  */

  let text =
    `CTS CONEXA - TOMORROW'S APPOINTMENT REPORT\n\n` +
    `Appointment Date: ${displayDate}\n\n` +
    `Appointments Fixed for Tomorrow: ${appointments.length}`;

  if (appointments.length === 0) {
    text +=
      "\n\nNo appointments are scheduled for tomorrow.";
  } else {
    const plainRows = appointments
      .map((item, index) => {
        return (
          `${index + 1}. ${item.businessName || "-"}\n` +
          `BA: ${item.userId?.name || "-"}\n` +
          `Contact: ${item.contact || "-"}\n` +
          `Appointment Time: ${formatAppointmentTime(item.appointmentTime)}\n` +
          `Map: ${getSafeMapLink(item.mapLink) || "-"}`
        );
      })
      .join("\n\n");

    text += `\n\n${plainRows}`;
  }

  text += "\n\nRegards,\nCTS CONEXA";

  /*
  EMAIL CELL STYLING
  */

  const cellStyle = (align = "left") =>
    `padding:12px;` +
    `border-bottom:1px solid #e2e8f0;` +
    `text-align:${align};` +
    `font-size:13px;` +
    `color:#334155;` +
    `vertical-align:top;`;

  /*
  HTML TABLE ROWS
  */

  const tableRows = appointments
    .map((item, index) => {
      const mapLink = getSafeMapLink(
        item.mapLink
      );

      const mapCell = mapLink
        ? `
          <a
            href="${escapeHtml(mapLink)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display:inline-block;
              padding:6px 10px;
              background:#eff6ff;
              color:#2563eb;
              text-decoration:none;
              border-radius:6px;
              font-size:12px;
              font-weight:600;
              white-space:nowrap;
            "
          >
            Map Link
          </a>
        `
        : "-";

      return `
        <tr>
          <td style="${cellStyle("center")}">
            ${index + 1}
          </td>

          <td style="${cellStyle()}font-weight:600;color:#0f172a;">
            ${escapeHtml(item.businessName || "-")}
          </td>

          <td style="${cellStyle()}">
            ${escapeHtml(item.userId?.name || "-")}
          </td>

          <td style="${cellStyle()}white-space:nowrap;">
            ${escapeHtml(item.contact || "-")}
          </td>

          <td style="${cellStyle()}white-space:nowrap;">
            ${escapeHtml(
        formatAppointmentTime(
          item.appointmentTime
        )
      )}
          </td>

          <td style="${cellStyle("center")}">
            ${mapCell}
          </td>
        </tr>
      `;
    })
    .join("");

  /*
  TABLE HEADERS
  */

  const htmlHeaders = [
    "Sl No",
    "Business Name",
    "BA Name",
    "Contact Number",
    "Appointment Time",
    "Location"
  ];

  /*
  HTML EMAIL
  */

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div style="
          max-width:1100px;
          margin:0 auto;
          padding:24px;
        ">
          <div style="
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            border:1px solid #e2e8f0;
          ">

            <div style="
              background:#0f172a;
              padding:20px 24px;
            ">
              <div style="
                color:#ffffff;
                font-size:20px;
                font-weight:700;
              ">
                CTS CONEXA
              </div>

              <div style="
                color:#cbd5e1;
                font-size:13px;
                margin-top:5px;
              ">
                Tomorrow's Appointment Report
              </div>
            </div>

            <div style="
              padding:20px 24px 12px;
            ">
              <div style="
                color:#64748b;
                font-size:13px;
              ">
                Appointment Date
              </div>

              <div style="
                color:#0f172a;
                font-size:16px;
                font-weight:700;
                margin-top:3px;
              ">
                ${displayDate}
              </div>

              <div style="
                margin-top:14px;
                display:inline-block;
                padding:8px 12px;
                background:#eff6ff;
                color:#1d4ed8;
                border-radius:7px;
                font-size:13px;
                font-weight:700;
              ">
                Appointments Fixed: ${appointments.length}
              </div>
            </div>

            ${appointments.length === 0
      ? `
                  <div style="
                    padding:25px;
                    text-align:center;
                    color:#64748b;
                    font-size:14px;
                  ">
                    No appointments are scheduled for tomorrow.
                  </div>
                `
      : `
                  <div style="
                    padding:12px 24px 24px;
                    overflow-x:auto;
                  ">
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        width:100%;
                        border-collapse:collapse;
                        border:1px solid #e2e8f0;
                      "
                    >
                      <thead>
                        <tr style="background:#f8fafc;">
                          ${htmlHeaders
        .map(
          (name) => `
                                <th style="
                                  padding:11px;
                                  text-align:left;
                                  font-size:12px;
                                  color:#475569;
                                  border-bottom:1px solid #e2e8f0;
                                  white-space:nowrap;
                                ">
                                  ${name}
                                </th>
                              `
        )
        .join("")}
                        </tr>
                      </thead>

                      <tbody>
                        ${tableRows}
                      </tbody>
                    </table>
                  </div>
                `
    }

            <div style="
              padding:14px 24px;
              background:#f8fafc;
              border-top:1px solid #e2e8f0;
              color:#94a3b8;
              font-size:11px;
              text-align:center;
            ">
              Automated report from CTS CONEXA
            </div>

          </div>
        </div>
      </body>
    </html>
  `;

  /*
  CREATE EXCEL ATTACHMENT
  */

  const excelBuffer =
    await createAppointmentExcel(
      appointments,
      displayDate
    );

  const fileDate =
    formatFileDate(displayDate);

  const attachments = [
    {
      filename:
        `CTS-Tomorrows-Appointments-${fileDate}.xlsx`,

      content: excelBuffer,

      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  ];

  /*
  SEND EMAIL
  */

  await sendEmail(
    recipient,
    subject,
    text,
    attachments,
    html
  );

  /*
  ==========================================
  SAVE CONFIRMED APPOINTMENT SNAPSHOT
  ==========================================
  */

  await DailyAppointmentSnapshot.updateOne(
    {
      appointmentDate: tomorrow
    },
    {
      $setOnInsert: {
        appointmentDate: tomorrow,

        confirmedCount: appointments.length,

        appointments: appointments.map((item) => ({
          presentationId: item._id,

          businessName: item.businessName || "",

          appointmentTime: item.appointmentTime || "",

          baId:
            item.assignedBaId?._id ||
            (
              item.fixedByRole !== "telecaller"
                ? item.userId?._id
                : null
            ) ||
            null,

          baName:
            item.assignedBaId?.name ||
            (
              item.fixedByRole !== "telecaller"
                ? item.userId?.name
                : ""
            ) ||
            "",

          fixedByRole: item.fixedByRole || ""
        })),

        capturedAt: new Date()
      }
    },
    {
      upsert: true
    }
  );

  console.log(
    `Appointment snapshot recorded for ${displayDate}`
  );

  console.log(
    `Tomorrow's appointment email sent for ${displayDate} - ${appointments.length} appointment(s)`
  );
};
