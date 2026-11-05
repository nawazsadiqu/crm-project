import ExcelJS from "exceljs";

import PresentationDetail from "../models/PresentationDetail.js";
import "../models/User.js";

import sendEmail from "./sendEmail.js";

/*
  Today's date in IST

  Example:
  2026-11-05
*/
const getTodayIST = () => {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date());

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;

  return `${year}-${month}-${day}`;
};

/*
  2026-11-05
  →
  05/11/2026
*/
const formatDisplayDate = (
  value
) => {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
    day
  ] = value.split("-");

  return `${day}/${month}/${year}`;
};

/*
  Used for attachment filename

  05/11/2026
  →
  05-11-2026
*/
const formatFileDate = (
  value
) => {
  return String(value || "")
    .replace(/\//g, "-");
};

const escapeHtml = (
  value
) => {
  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

const getSafeMapLink = (
  value
) => {
  const link =
    String(
      value || ""
    ).trim();

  if (
    link.startsWith("https://") ||
    link.startsWith("http://")
  ) {
    return link;
  }

  return "";
};

/*
  =========================================
  CREATE EXCEL FILE
  =========================================
*/
const createAppointmentExcel =
  async (
    appointments,
    displayDate
  ) => {
    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "CTS CONEXA";

    workbook.created =
      new Date();

    const worksheet =
      workbook.addWorksheet(
        "Today's Appointments"
      );

    /*
      TITLE
    */

    worksheet.mergeCells(
      "A1:E1"
    );

    const titleCell =
      worksheet.getCell("A1");

    titleCell.value =
      "CTS CONEXA - Daily Appointment Report";

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

    worksheet.getRow(1).height =
      28;

    /*
      DATE
    */

    worksheet.mergeCells(
      "A2:E2"
    );

    const dateCell =
      worksheet.getCell("A2");

    dateCell.value =
      `Date: ${displayDate} | Total Appointments: ${appointments.length}`;

    dateCell.font = {
      bold: true,
      size: 11
    };

    dateCell.alignment = {
      horizontal: "center"
    };

    worksheet.getRow(2).height =
      22;

    /*
      EMPTY SPACER ROW
    */

    worksheet.addRow([]);

    /*
      TABLE HEADER
    */

    const headerRow =
      worksheet.addRow([
        "Sl No",
        "Business Name",
        "BA Name",
        "Contact Number",
        "Map Link"
      ]);

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
      horizontal: "center"
    };

    headerRow.height = 24;

    /*
      TABLE DATA
    */

    appointments.forEach(
      (item, index) => {
        const baName =
          item.userId?.name ||
          "-";

        const mapLink =
          getSafeMapLink(
            item.mapLink
          );

        const row =
          worksheet.addRow([
            index + 1,
            item.businessName ||
              "-",
            baName,
            item.contact ||
              "-",
            mapLink
              ? "Map Link"
              : "-"
          ]);

        /*
          Make Map Link clickable
        */

        if (mapLink) {
          const mapCell =
            row.getCell(5);

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
          vertical: "middle"
        };

        row.height = 22;
      }
    );

    /*
      COLUMN WIDTHS
    */

    worksheet.getColumn(1).width =
      10;

    worksheet.getColumn(2).width =
      38;

    worksheet.getColumn(3).width =
      24;

    worksheet.getColumn(4).width =
      20;

    worksheet.getColumn(5).width =
      16;

    /*
      CENTER SELECTED COLUMNS
    */

    worksheet.getColumn(1).alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    worksheet.getColumn(4).alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    worksheet.getColumn(5).alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    /*
      ADD BORDERS TO TABLE

      Header starts on row 4.
    */

    for (
      let rowNumber = 4;
      rowNumber <=
      worksheet.rowCount;
      rowNumber += 1
    ) {
      const row =
        worksheet.getRow(
          rowNumber
        );

      row.eachCell(
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
      to: "E4"
    };

    /*
      RETURN FILE AS BUFFER
    */

    const buffer =
      await workbook.xlsx
        .writeBuffer();

    return Buffer.from(
      buffer
    );
  };

/*
  =========================================
  SEND DAILY EMAIL
  =========================================
*/
export const sendDailyAppointmentEmail =
  async () => {
    const recipient =
      String(
        process.env
          .DAILY_APPOINTMENT_EMAIL ||
          ""
      ).trim();

    if (!recipient) {
      console.log(
        "DAILY_APPOINTMENT_EMAIL not configured"
      );

      return;
    }

    const today =
      getTodayIST();

    /*
      TODAY'S APPOINTMENTS
    */

    const appointments =
      await PresentationDetail.find({
        appointmentDate:
          today,

        status:
          "Appointment Fixed"
      })
        .populate(
          "userId",
          "name email"
        )
        .sort({
          appointmentTime: 1,
          createdAt: 1
        })
        .lean();

    const displayDate =
      formatDisplayDate(
        today
      );

    const subject =
      `CTS - Today's Appointments (${displayDate})`;

    /*
      =========================================
      PLAIN TEXT FALLBACK
      =========================================
    */

    let text =
      `CTS CONEXA - DAILY APPOINTMENT REPORT

Date: ${displayDate}

Appointments Fixed for Today: ${appointments.length}`;

    if (
      appointments.length ===
      0
    ) {
      text += `

No appointments are scheduled for today.

Regards,
CTS CONEXA`;
    } else {
      const plainRows =
        appointments
          .map(
            (
              item,
              index
            ) => {
              return `${index + 1}. ${item.businessName || "-"}

BA: ${item.userId?.name || "-"}
Contact: ${item.contact || "-"}
Map: ${item.mapLink || "-"}`;
            }
          )
          .join(
            "\n\n"
          );

      text += `

${plainRows}

Regards,
CTS CONEXA`;
    }

    /*
      =========================================
      HTML TABLE ROWS
      =========================================
    */

    const tableRows =
      appointments
        .map(
          (
            item,
            index
          ) => {
            const businessName =
              escapeHtml(
                item.businessName ||
                  "-"
              );

            const baName =
              escapeHtml(
                item.userId
                  ?.name ||
                  "-"
              );

            const contact =
              escapeHtml(
                item.contact ||
                  "-"
              );

            const mapLink =
              getSafeMapLink(
                item.mapLink
              );

            const mapCell =
              mapLink
                ? `
                  <a
                    href="${escapeHtml(
                      mapLink
                    )}"
                    target="_blank"
                    style="
                      display:inline-block;
                      padding:6px 10px;
                      background:#eff6ff;
                      color:#2563eb;
                      text-decoration:none;
                      border-radius:6px;
                      font-size:12px;
                      font-weight:600;
                    "
                  >
                    Map Link
                  </a>
                `
                : "-";

            return `
              <tr>
                <td
                  style="
                    padding:12px;
                    border-bottom:1px solid #e2e8f0;
                    text-align:center;
                    font-size:13px;
                    color:#475569;
                  "
                >
                  ${index + 1}
                </td>

                <td
                  style="
                    padding:12px;
                    border-bottom:1px solid #e2e8f0;
                    font-size:13px;
                    color:#0f172a;
                    font-weight:600;
                  "
                >
                  ${businessName}
                </td>

                <td
                  style="
                    padding:12px;
                    border-bottom:1px solid #e2e8f0;
                    font-size:13px;
                    color:#334155;
                  "
                >
                  ${baName}
                </td>

                <td
                  style="
                    padding:12px;
                    border-bottom:1px solid #e2e8f0;
                    font-size:13px;
                    color:#334155;
                    white-space:nowrap;
                  "
                >
                  ${contact}
                </td>

                <td
                  style="
                    padding:12px;
                    border-bottom:1px solid #e2e8f0;
                    text-align:center;
                  "
                >
                  ${mapCell}
                </td>
              </tr>
            `;
          }
        )
        .join("");

    /*
      =========================================
      HTML EMAIL
      =========================================
    */

    const html = `
      <!DOCTYPE html>

      <html>
        <body
          style="
            margin:0;
            padding:0;
            background:#f1f5f9;
            font-family:Arial, Helvetica, sans-serif;
          "
        >
          <div
            style="
              max-width:850px;
              margin:0 auto;
              padding:24px;
            "
          >
            <div
              style="
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                border:1px solid #e2e8f0;
              "
            >

              <div
                style="
                  background:#0f172a;
                  padding:20px 24px;
                "
              >
                <div
                  style="
                    color:#ffffff;
                    font-size:20px;
                    font-weight:700;
                  "
                >
                  CTS CONEXA
                </div>

                <div
                  style="
                    color:#cbd5e1;
                    font-size:13px;
                    margin-top:5px;
                  "
                >
                  Daily Appointment Report
                </div>
              </div>

              <div
                style="
                  padding:20px 24px 12px;
                "
              >
                <div
                  style="
                    color:#64748b;
                    font-size:13px;
                  "
                >
                  Date
                </div>

                <div
                  style="
                    color:#0f172a;
                    font-size:16px;
                    font-weight:700;
                    margin-top:3px;
                  "
                >
                  ${displayDate}
                </div>

                <div
                  style="
                    margin-top:14px;
                    display:inline-block;
                    padding:8px 12px;
                    background:#eff6ff;
                    color:#1d4ed8;
                    border-radius:7px;
                    font-size:13px;
                    font-weight:700;
                  "
                >
                  Appointments Fixed:
                  ${appointments.length}
                </div>
              </div>

              ${
                appointments.length ===
                0
                  ? `
                    <div
                      style="
                        padding:25px;
                        text-align:center;
                        color:#64748b;
                        font-size:14px;
                      "
                    >
                      No appointments are
                      scheduled for today.
                    </div>
                  `
                  : `
                    <div
                      style="
                        padding:12px 24px 24px;
                        overflow-x:auto;
                      "
                    >
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
                          <tr
                            style="
                              background:#f8fafc;
                            "
                          >
                            <th
                              style="
                                padding:11px;
                                text-align:center;
                                font-size:12px;
                                color:#475569;
                                border-bottom:1px solid #e2e8f0;
                              "
                            >
                              Sl No
                            </th>

                            <th
                              style="
                                padding:11px;
                                text-align:left;
                                font-size:12px;
                                color:#475569;
                                border-bottom:1px solid #e2e8f0;
                              "
                            >
                              Business Name
                            </th>

                            <th
                              style="
                                padding:11px;
                                text-align:left;
                                font-size:12px;
                                color:#475569;
                                border-bottom:1px solid #e2e8f0;
                              "
                            >
                              BA Name
                            </th>

                            <th
                              style="
                                padding:11px;
                                text-align:left;
                                font-size:12px;
                                color:#475569;
                                border-bottom:1px solid #e2e8f0;
                              "
                            >
                              Contact Number
                            </th>

                            <th
                              style="
                                padding:11px;
                                text-align:center;
                                font-size:12px;
                                color:#475569;
                                border-bottom:1px solid #e2e8f0;
                              "
                            >
                              Location
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          ${tableRows}
                        </tbody>
                      </table>
                    </div>
                  `
              }

              <div
                style="
                  padding:14px 24px;
                  background:#f8fafc;
                  border-top:1px solid #e2e8f0;
                  color:#94a3b8;
                  font-size:11px;
                  text-align:center;
                "
              >
                Automated report from
                CTS CONEXA
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    /*
      =========================================
      EXCEL ATTACHMENT
      =========================================
    */

    const excelBuffer =
      await createAppointmentExcel(
        appointments,
        displayDate
      );

    const fileDate =
      formatFileDate(
        displayDate
      );

    const attachments = [
      {
        filename:
          `CTS-Todays-Appointments-${fileDate}.xlsx`,

        content:
          excelBuffer,

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

    console.log(
      `Daily appointment email sent - ${appointments.length} appointment(s)`
    );
  };