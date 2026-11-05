import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";

import connectDB from "../config/db.js";
import FormDetail from "../models/FormDetail.js";
import PresentationDetail from "../models/PresentationDetail.js";

dotenv.config({ path: "./.env" });

const runBackfill = async () => {
  try {
    await connectDB();

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "FORM → APPOINTMENT BACKFILL"
    );
    console.log(
      "======================================"
    );
    console.log("");

    const reportPath = path.resolve(
      process.cwd(),
      "scripts",
      "output",
      "form-appointment-backfill-dry-run.json"
    );

    const rawReport =
      await fs.readFile(
        reportPath,
        "utf8"
      );

    const report = JSON.parse(rawReport);

    const confidentMatches =
      Array.isArray(
        report.confidentMatches
      )
        ? report.confidentMatches
        : [];

    console.log(
      `Confident matches in report: ${confidentMatches.length}`
    );

    /*
      --------------------------------
      DUPLICATE APPOINTMENT CHECK
      --------------------------------

      One appointment should not be
      linked to multiple root forms.
    */

    const presentationUsage =
      new Map();

    for (const match of confidentMatches) {
      const presentationId =
        String(
          match.matchedPresentationId ||
          ""
        );

      if (!presentationId) continue;

      if (
        !presentationUsage.has(
          presentationId
        )
      ) {
        presentationUsage.set(
          presentationId,
          []
        );
      }

      presentationUsage
        .get(presentationId)
        .push(match.formId);
    }

    const duplicatePresentationIds =
      new Set(
        [...presentationUsage.entries()]
          .filter(
            ([, formIds]) =>
              formIds.length > 1
          )
          .map(
            ([presentationId]) =>
              presentationId
          )
      );

    console.log(
      `Duplicate appointment matches: ${duplicatePresentationIds.size}`
    );

    /*
      --------------------------------
      VALIDATE EVERY MATCH AGAIN
      --------------------------------
    */

    const validUpdates = [];
    const skipped = [];

    for (const match of confidentMatches) {
      const formId =
        String(match.formId || "");

      const presentationId =
        String(
          match.matchedPresentationId ||
          ""
        );

      if (
        !formId ||
        !presentationId
      ) {
        skipped.push({
          ...match,
          skipReason:
            "Missing formId or presentationId",
        });

        continue;
      }

      /*
        If the same appointment appeared
        against multiple forms, do not
        automatically link any of them.
      */

      if (
        duplicatePresentationIds.has(
          presentationId
        )
      ) {
        skipped.push({
          ...match,
          skipReason:
            "Same appointment matched multiple forms",
        });

        continue;
      }

      const form =
        await FormDetail.findById(
          formId
        )
          .select(
            "_id userId parentFormId sourcePresentationId"
          )
          .lean();

      if (!form) {
        skipped.push({
          ...match,
          skipReason:
            "Form no longer exists",
        });

        continue;
      }

      /*
        Only root forms should be
        linked as closed deals.
      */

      if (form.parentFormId) {
        skipped.push({
          ...match,
          skipReason:
            "Form is an additional payment record",
        });

        continue;
      }

      /*
        Never overwrite an existing link.
      */

      if (
        form.sourcePresentationId
      ) {
        skipped.push({
          ...match,
          skipReason:
            "Form already linked",
        });

        continue;
      }

      const presentation =
        await PresentationDetail.findById(
          presentationId
        )
          .select(
            "_id userId businessName contact appointmentDate visitedDate"
          )
          .lean();

      if (!presentation) {
        skipped.push({
          ...match,
          skipReason:
            "Appointment no longer exists",
        });

        continue;
      }

      /*
        Final safety check:
        form and appointment must belong
        to the same BA/user.
      */

      if (
        String(form.userId) !==
        String(
          presentation.userId
        )
      ) {
        skipped.push({
          ...match,
          skipReason:
            "Form and appointment belong to different users",
        });

        continue;
      }

      validUpdates.push({
        formId,
        presentationId,

        businessName:
          match.businessName || "",

        matchedBusinessName:
          match.matchedBusinessName ||
          "",

        score:
          match.score || 0,

        reasons:
          match.reasons || [],
      });
    }

    console.log(
      `Validated updates: ${validUpdates.length}`
    );

    console.log(
      `Skipped after safety checks: ${skipped.length}`
    );

    /*
      --------------------------------
      APPLY UPDATES
      --------------------------------
    */

    let updatedCount = 0;

    if (validUpdates.length > 0) {
      const operations =
        validUpdates.map(
          (item) => ({
            updateOne: {
              filter: {
                _id: item.formId,

                /*
                  Do not overwrite a link
                  if another process added
                  one after validation.
                */

                $or: [
                  {
                    sourcePresentationId: null,
                  },
                  {
                    sourcePresentationId: {
                      $exists: false,
                    },
                  },
                ],
              },

              update: {
                $set: {
                  sourcePresentationId:
                    item.presentationId,
                },
              },
            },
          })
        );

      const result =
        await FormDetail.bulkWrite(
          operations,
          {
            ordered: false,
          }
        );

      updatedCount =
        result.modifiedCount || 0;
    }

    /*
      --------------------------------
      SAVE RESULT REPORT
      --------------------------------
    */

    const outputDirectory =
      path.resolve(
        process.cwd(),
        "scripts",
        "output"
      );

    await fs.mkdir(
      outputDirectory,
      {
        recursive: true,
      }
    );

    const resultPath =
      path.join(
        outputDirectory,
        "form-appointment-backfill-applied.json"
      );

    await fs.writeFile(
      resultPath,
      JSON.stringify(
        {
          executedAt:
            new Date().toISOString(),

          dryRunConfidentMatches:
            confidentMatches.length,

          duplicatePresentationMatches:
            duplicatePresentationIds.size,

          validatedUpdates:
            validUpdates.length,

          updatedCount,

          skippedCount:
            skipped.length,

          applied:
            validUpdates,

          skipped,
        },
        null,
        2
      ),
      "utf8"
    );

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      `Database records updated : ${updatedCount}`
    );

    console.log(
      `Skipped                 : ${skipped.length}`
    );

    console.log(
      "======================================"
    );

    console.log("");
    console.log(
      "Result report saved:"
    );
    console.log(resultPath);
    console.log("");
  } catch (error) {
    console.error(
      "Backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runBackfill();