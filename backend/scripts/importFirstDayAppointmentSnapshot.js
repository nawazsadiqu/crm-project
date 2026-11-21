
/*
==========================================
CTS CONEXA
FIRST-DAY APPOINTMENT SNAPSHOT IMPORT
==========================================

Purpose:

Import confirmed appointments from the
ORIGINAL morning appointment email's
Excel attachment.

This is required only for the first day
of deploying the Fixed vs Result Report.

Example:

node scripts/importFirstDayAppointmentSnapshot.js 2026-11-21 /path/to/report.xlsx

The script:

1. Reads the original appointment Excel.
2. Checks the appointment date.
3. Finds matching PresentationDetail records.
4. Saves the original confirmed count.
5. Preserves the appointment IDs.
6. Refuses to overwrite an existing snapshot.

==========================================
*/

import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

import ExcelJS from "exceljs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

import PresentationDetail from "../models/PresentationDetail.js";

import DailyAppointmentSnapshot from "../models/DailyAppointmentSnapshot.js";

/*
==========================================
COMMAND LINE ARGUMENTS
==========================================
*/

const [date, excelPath] =
    process.argv.slice(2);

if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date || "") ||
    !excelPath
) {
    console.error(
        "Usage: node scripts/importFirstDayAppointmentSnapshot.js YYYY-MM-DD /path/to/original-report.xlsx"
    );

    process.exit(1);
}

/*
==========================================
HELPER FUNCTIONS
==========================================
*/

const digits = (value) => {
    return String(value ?? "")
        .replace(/\D/g, "");
};

const clean = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase();
};

const regexpEscape = (value) => {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

/*
==========================================
MAIN IMPORT FUNCTION
==========================================
*/

const run = async () => {

    /*
    ========================================
    STEP 1: READ EXCEL FILE
    ========================================
    */

    const workbook =
        new ExcelJS.Workbook();

    await workbook.xlsx.readFile(
        excelPath
    );

    const sheet =
        workbook.worksheets[0];

    if (!sheet) {
        throw new Error(
            "Excel file has no worksheets"
        );
    }

    /*
    ========================================
    STEP 2: VERIFY REPORT DATE
    ========================================
    */

    const [year, month, day] =
        date.split("-");

    const reportDate =
        `${day}/${month}/${year}`;

    const excelDateText = String(
        sheet.getCell("A2").text || ""
    );

    if (
        !excelDateText.includes(reportDate)
    ) {
        throw new Error(
            `Excel report date does not match ${reportDate}. Found: ${excelDateText || "(empty)"}`
        );
    }

    /*
    ========================================
    STEP 3: IDENTIFY EXCEL COLUMNS
    ========================================
    */

    let headerNumber = 0;

    let columns = {};

    for (
        let rowNumber = 1;
        rowNumber <= Math.min(
            sheet.rowCount,
            15
        );
        rowNumber++
    ) {

        const row =
            sheet.getRow(rowNumber);

        const found = {};

        row.eachCell(
            {
                includeEmpty: false
            },
            (cell, index) => {
                found[clean(cell.text)] =
                    index;
            }
        );

        if (
            found["business name"] &&
            found["contact number"]
        ) {
            headerNumber = rowNumber;
            columns = found;
            break;
        }
    }

    if (!headerNumber) {
        throw new Error(
            "Could not find Business Name and Contact Number headers"
        );
    }

    /*
    ========================================
    STEP 4: READ ORIGINAL APPOINTMENTS
    ========================================
    */

    const originalRows = [];

    for (
        let rowNumber = headerNumber + 1;
        rowNumber <= sheet.rowCount;
        rowNumber++
    ) {

        const row =
            sheet.getRow(rowNumber);

        const businessName = String(
            row.getCell(
                columns["business name"]
            ).text || ""
        ).trim();

        if (!businessName) {
            continue;
        }

        const contact = String(
            row.getCell(
                columns["contact number"]
            ).text || ""
        ).trim();

        const mapColumn =
            columns["map link"] ||
            columns["location"];

        const mapCell = mapColumn
            ? row.getCell(mapColumn)
            : null;

        const mapLink = String(
            mapCell?.value?.hyperlink || ""
        ).trim();

        const baName = String(
            row.getCell(
                columns["ba name"] || 3
            ).text || ""
        ).trim();

        originalRows.push({
            businessName,
            contact,
            mapLink,
            rowNumber,
            baName
        });
    }

    if (!originalRows.length) {
        throw new Error(
            "No appointments found in Excel"
        );
    }

    console.log(
        "Original confirmed appointments:",
        originalRows.length
    );

    /*
    ========================================
    STEP 5: CONNECT DATABASE
    ========================================
    */

    await connectDB();

    /*
    Do not overwrite an existing snapshot.
    */

    const existingSnapshot =
        await DailyAppointmentSnapshot.exists({
            appointmentDate: date
        });

    if (existingSnapshot) {
        throw new Error(
            `Snapshot for ${date} already exists; refusing to overwrite it`
        );
    }

    /*
    ========================================
    STEP 6: MATCH APPOINTMENTS
    ========================================
    */

    const matched = [];

    const ids = new Set();

    const errors = [];

    for (const row of originalRows) {

        let candidates =
            await PresentationDetail.find({
                businessName: {
                    $regex:
                        `^${regexpEscape(
                            row.businessName
                        )}$`,

                    $options: "i"
                }
            })
                .select(
                    "businessName contact mapLink appointmentDate appointmentTime fixedByRole userId assignedBaId"
                )
                .lean();

        /*
        Match contact number.
        */

        if (
            row.contact &&
            digits(row.contact)
        ) {

            const target =
                digits(row.contact)
                    .slice(-10);

            candidates =
                candidates.filter(
                    (candidate) =>
                        digits(
                            candidate.contact
                        ).slice(-10) ===
                        target
                );
        }

        /*
        If multiple records remain,
        compare Google Maps links.
        */

        if (
            candidates.length > 1 &&
            row.mapLink
        ) {

            candidates =
                candidates.filter(
                    (candidate) =>
                        clean(
                            candidate.mapLink
                        ) ===
                        clean(
                            row.mapLink
                        )
                );
        }

        /*
        If still duplicated, compare
        appointment date.
        */

        if (
            candidates.length > 1
        ) {

            candidates =
                candidates.filter(
                    (candidate) =>
                        candidate.appointmentDate ===
                        date
                );
        }

        /*
        Require exactly one matching record.
        */

        if (
            candidates.length !== 1
        ) {

            errors.push(
                `Excel row ${row.rowNumber}: ${row.businessName} (${row.contact}) -> ${candidates.length} matching records`
            );

            continue;
        }

        const item =
            candidates[0];

        const id =
            String(item._id);

        /*
        Prevent duplicate presentation IDs.
        */

        if (
            ids.has(id)
        ) {

            errors.push(
                `Excel row ${row.rowNumber}: duplicate presentation match ${id}`
            );

            continue;
        }

        ids.add(id);

        /*
        Prepare snapshot appointment.
        */

        matched.push({

            presentationId:
                item._id,

            businessName:
                row.businessName,

            appointmentTime:
                item.appointmentTime || "",

            baId:
                item.assignedBaId ||
                (
                    item.fixedByRole !==
                        "telecaller"
                        ? item.userId
                        : null
                ),

            baName:
                row.baName,

            fixedByRole:
                item.fixedByRole || ""

        });
    }

    /*
    ========================================
    STEP 7: VALIDATE MATCHING
    ========================================
    */

    if (
        errors.length
    ) {

        console.error(
            "Nothing was saved. Please resolve these mismatches:"
        );

        errors.forEach(
            (error) => {
                console.error(
                    " -",
                    error
                );
            }
        );

        throw new Error(
            `${errors.length} unresolved original appointments`
        );
    }

    /*
    ========================================
    STEP 8: CREATE SNAPSHOT
    ========================================
    */

    await DailyAppointmentSnapshot.create({

        appointmentDate:
            date,

        confirmedCount:
            originalRows.length,

        appointments:
            matched,

        capturedAt:
            new Date()

    });

    console.log(
        `FIRST-DAY SNAPSHOT CREATED for ${date}: ${matched.length} confirmed appointments`
    );
};

/*
==========================================
EXECUTE SCRIPT
==========================================
*/

try {

    await run();

} catch (error) {

    console.error(
        "First-day snapshot import failed:",
        error.message
    );

    process.exitCode = 1;

} finally {

    await mongoose.disconnect();

}
