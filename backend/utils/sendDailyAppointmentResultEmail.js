
import DailyAppointmentSnapshot from "../models/DailyAppointmentSnapshot.js";
import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import EmployeeDetail from "../models/EmployeeDetail.js";
import { getRevenueBreakupByPaymentDate } from "./revenueByPaymentDate.js";
import sendEmail from "./sendEmail.js";

const getTodayIST = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const get = (type) =>
        parts.find((part) => part.type === type)?.value;

    return `${get("year")}-${get("month")}-${get("day")}`;
};

const formatDate = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
};

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const formatMoney = (amount) =>
    `₹${new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(Number(amount) || 0)}`;

const groupByEmployee = (
    records,
    getEmployeeId,
    employeesById
) => {
    const counts = new Map();

    records.forEach((record) => {
        const id = String(getEmployeeId(record) || "");
        const name = employeesById.get(id) || "Unassigned";

        counts.set(name, (counts.get(name) || 0) + 1);
    });

    return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort(
            (a, b) =>
                b.count - a.count ||
                a.name.localeCompare(b.name)
        );
};

const groupToText = (
    rows,
    valueKey,
    formatter = String
) =>
    rows.length
        ? rows
            .map(
                (row) =>
                    `  ${row.name} - ${formatter(row[valueKey])}`
            )
            .join("\n")
        : "  -";

const groupToHtml = (
    rows,
    valueKey,
    formatter = String
) =>
    rows.length
        ? rows
            .map(
                (row) => `
            <tr>
              <td style="padding:5px 0;color:#334155;">
                ${escapeHtml(row.name)}
              </td>
              <td style="padding:5px 0;text-align:right;color:#334155;">
                ${escapeHtml(formatter(row[valueKey]))}
              </td>
            </tr>
          `
            )
            .join("")
        : `<tr><td colspan="2">No entries</td></tr>`;

export const sendDailyAppointmentResultEmail = async (
    date = getTodayIST()
) => {
    const recipient = String(
        process.env.DAILY_APPOINTMENT_EMAIL || ""
    ).trim();

    if (!recipient) {
        console.log("DAILY_APPOINTMENT_EMAIL not configured");
        return;
    }

    /*
      Read the original confirmed appointments.
    */
    const snapshot =
        await DailyAppointmentSnapshot.findOne({
            appointmentDate: date
        }).lean();

    if (!snapshot) {
        throw new Error(
            `No appointment snapshot for ${date}. ` +
            "Initialize the first-day snapshot before running this report."
        );
    }

    const confirmedIds = (snapshot.appointments || [])
        .map((item) => item.presentationId)
        .filter(Boolean);

    /*
      Count visits from the original confirmed set.
    */
    const visits = confirmedIds.length
        ? await PresentationDetail.find({
            _id: { $in: confirmedIds },
            isVisitedAppointment: true,
            visitedDate: date
        }).lean()
        : [];

    /*
      Fetch today's forms and employee names.
    */
    const [forms, employees] = await Promise.all([
        FormDetail.find({ date }).lean(),

        EmployeeDetail.find({
            role: { $in: ["ba", "telecaller"] },
            userId: { $ne: null }
        })
            .select("name role userId")
            .lean()
    ]);

    const employeesById = new Map(
        employees.map((employee) => [
            String(employee.userId),
            employee.name || "Unknown"
        ])
    );

    /*
      VISITS BY BA
    */
    const visitRows = groupByEmployee(
        visits,
        (visit) =>
            visit.visitedByBaId ||
            (visit.fixedByRole === "telecaller"
                ? visit.assignedBaId
                : visit.userId),
        employeesById
    );

    /*
      FORMS BY EMPLOYEE

      For a Telecaller-originated deal, use the
      closing BA when available.
    */
    const formRows = groupByEmployee(
        forms,
        (form) =>
            form.dealSource === "telecaller"
                ? form.closedByBaId || form.userId
                : form.userId,
        employeesById
    );

    /*
      REVENUE BY BA

      Uses existing Admin performance rules:
      Own BA deal = 100% Ex-GST credit
      TC-origin deal closed by BA = 50% Ex-GST credit
    */
    const bas = employees.filter(
        (employee) => employee.role === "ba"
    );

    const revenueValues = await Promise.all(
        bas.map(async (employee) => {
            const breakup =
                await getRevenueBreakupByPaymentDate({
                    userId: employee.userId,
                    exactDate: date,
                    creditRole: "ba",
                    useRevenueCredit: true
                });

            return {
                name: employee.name || "Unknown",
                amount: Number(breakup.exGst || 0)
            };
        })
    );

    const revenueRows = revenueValues
        .filter((item) => item.amount > 0)
        .sort(
            (a, b) =>
                b.amount - a.amount ||
                a.name.localeCompare(b.name)
        );

    const revenueTotal = Number(
        revenueRows
            .reduce((sum, row) => sum + row.amount, 0)
            .toFixed(2)
    );

    const reportDate = formatDate(date);

    const subject =
        `CTS - Fixed vs Result Report (${reportDate})`;

    /*
      PLAIN TEXT REPORT
    */
    const text = `
CTS CONEXA - FIXED VS RESULT REPORT

${reportDate}

Confirmed Appointments - ${snapshot.confirmedCount}

Visited - ${visits.length}
${groupToText(visitRows, "count")}

Forms - ${forms.length}
${groupToText(formRows, "count")}

Revenue - ${formatMoney(revenueTotal)}
${groupToText(revenueRows, "amount", formatMoney)}

Revenue is BA performance credit, excluding GST.

Regards,
CTS CONEXA
`.trim();

    /*
      HTML REPORT
    */
    const section = (
        title,
        total,
        rows,
        valueKey,
        formatter = String
    ) => `
    <div style="padding:18px 24px;border-top:1px solid #e2e8f0;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;">
        ${escapeHtml(title)}
        <span style="float:right;color:#2563eb;">
          ${escapeHtml(total)}
        </span>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="margin-top:10px;">
        ${groupToHtml(rows, valueKey, formatter)}
      </table>
    </div>
  `;

    const html = `
    <!DOCTYPE html>
    <html>
      <body style="
        margin:0;
        background:#f1f5f9;
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div style="
          max-width:640px;
          margin:24px auto;
          padding:0 12px;
        ">
          <div style="
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:12px;
            overflow:hidden;
          ">

            <div style="
              padding:22px 24px;
              background:#0f172a;
              color:#ffffff;
            ">
              <div style="font-size:20px;font-weight:700;">
                CTS CONEXA
              </div>
              <div style="margin-top:5px;color:#cbd5e1;">
                Daily Fixed vs Result Report
              </div>
            </div>

            <div style="padding:18px 24px;">
              <div style="font-size:14px;color:#64748b;">
                Report Date
              </div>
              <div style="font-size:19px;font-weight:700;">
                ${escapeHtml(reportDate)}
              </div>
            </div>

            <div style="
              padding:18px 24px;
              border-top:1px solid #e2e8f0;
              font-size:15px;
              font-weight:700;
            ">
              Confirmed Appointments
              <span style="float:right;color:#2563eb;">
                ${snapshot.confirmedCount}
              </span>
            </div>

            ${section(
        "Visited",
        String(visits.length),
        visitRows,
        "count"
    )}

            ${section(
        "Forms",
        String(forms.length),
        formRows,
        "count"
    )}

            ${section(
        "Revenue",
        formatMoney(revenueTotal),
        revenueRows,
        "amount",
        formatMoney
    )}

            <div style="
              padding:12px 24px;
              background:#f8fafc;
              border-top:1px solid #e2e8f0;
              font-size:11px;
              color:#64748b;
            ">
              Revenue is BA performance credit, excluding GST.
              <div style="margin-top:5px;">
                Automated report from CTS CONEXA
              </div>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;

    await sendEmail(
        recipient,
        subject,
        text,
        [],
        html
    );

    console.log(
        `Fixed vs Result Report sent for ${reportDate}`
    );
};
