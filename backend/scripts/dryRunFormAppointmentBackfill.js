import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";

import connectDB from "../config/db.js";
import FormDetail from "../models/FormDetail.js";
import PresentationDetail from "../models/PresentationDetail.js";

dotenv.config({ path: "./.env" });

const AUTO_MATCH_MIN_SCORE = 80;
const AUTO_MATCH_MIN_MARGIN = 15;

/*
  ----------------------------
  NORMALIZATION HELPERS
  ----------------------------
*/

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return digits;
};

const normalizeMapLink = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("?")[0]
    .replace(/\/+$/, "");
};

const getMapPlaceToken = (value) => {
  const mapValue = String(value || "");

  const match = mapValue.match(
    /\/place\/([^/?]+)/i
  );

  if (!match) {
    return "";
  }

  try {
    return normalizeText(
      decodeURIComponent(match[1])
    );
  } catch {
    return normalizeText(match[1]);
  }
};

/*
  Supports:

  2026-10-25
  25/10/2026
*/

const parseDate = (value) => {
  if (!value) return null;

  const text = String(value).trim();

  let year;
  let month;
  let day;

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {
    [year, month, day] = text
      .split("-")
      .map(Number);
  } else if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(text)
  ) {
    [day, month, year] = text
      .split("/")
      .map(Number);
  } else {
    return null;
  }

  return new Date(
    Date.UTC(year, month - 1, day)
  );
};

const getDaysDifference = (
  firstDate,
  secondDate
) => {
  const first = parseDate(firstDate);
  const second = parseDate(secondDate);

  if (!first || !second) {
    return null;
  }

  const milliseconds = Math.abs(
    first.getTime() - second.getTime()
  );

  return Math.round(
    milliseconds /
      (1000 * 60 * 60 * 24)
  );
};

/*
  ----------------------------
  MATCHING LOGIC
  ----------------------------
*/

const scoreCandidate = (
  form,
  presentation
) => {
  let score = 0;

  const reasons = [];

  const formBusiness =
    normalizeText(form.businessName);

  const appointmentBusiness =
    normalizeText(
      presentation.businessName
    );

  const formPhone =
    normalizePhone(form.mobileNumber);

  const appointmentPhone =
    normalizePhone(
      presentation.contact
    );

  const formMap =
    normalizeMapLink(
      form.googleMapLink
    );

  const appointmentMap =
    normalizeMapLink(
      presentation.mapLink
    );

  const formMapPlace =
    getMapPlaceToken(
      form.googleMapLink
    );

  const appointmentMapPlace =
    getMapPlaceToken(
      presentation.mapLink
    );

  let identityMatches = 0;

  /*
    Business Name
  */

  if (
    formBusiness &&
    appointmentBusiness &&
    formBusiness === appointmentBusiness
  ) {
    score += 35;
    identityMatches += 1;

    reasons.push(
      "Business name exact match"
    );
  }

  /*
    Contact Number
  */

  if (
    formPhone &&
    appointmentPhone &&
    formPhone === appointmentPhone
  ) {
    score += 45;
    identityMatches += 1;

    reasons.push(
      "Contact number exact match"
    );
  }

  /*
    Exact Maps Link
  */

  if (
    formMap &&
    appointmentMap &&
    formMap === appointmentMap
  ) {
    score += 30;
    identityMatches += 1;

    reasons.push(
      "Google Maps link exact match"
    );
  } else if (
    formMapPlace &&
    appointmentMapPlace &&
    formMapPlace === appointmentMapPlace
  ) {
    /*
      Same Google Maps place,
      even if URL parameters differ.
    */

    score += 20;
    identityMatches += 1;

    reasons.push(
      "Google Maps place match"
    );
  }

  /*
    Compare form date with visited date.
  */

  const visitedDifference =
    getDaysDifference(
      form.date,
      presentation.visitedDate
    );

  if (visitedDifference === 0) {
    score += 30;

    reasons.push(
      "Form date = visited date"
    );
  } else if (
    visitedDifference !== null &&
    visitedDifference <= 3
  ) {
    score += 18;

    reasons.push(
      `Visited date within ${visitedDifference} day(s)`
    );
  } else if (
    visitedDifference !== null &&
    visitedDifference <= 7
  ) {
    score += 10;

    reasons.push(
      `Visited date within ${visitedDifference} day(s)`
    );
  }

  /*
    Compare form date with
    appointment date.
  */

  const appointmentDifference =
    getDaysDifference(
      form.date,
      presentation.appointmentDate
    );

  if (appointmentDifference === 0) {
    score += 20;

    reasons.push(
      "Form date = appointment date"
    );
  } else if (
    appointmentDifference !== null &&
    appointmentDifference <= 3
  ) {
    score += 12;

    reasons.push(
      `Appointment date within ${appointmentDifference} day(s)`
    );
  } else if (
    appointmentDifference !== null &&
    appointmentDifference <= 7
  ) {
    score += 6;

    reasons.push(
      `Appointment date within ${appointmentDifference} day(s)`
    );
  }

  return {
    score,
    identityMatches,
    reasons,
  };
};

/*
  ----------------------------
  MAIN DRY RUN
  ----------------------------
*/

const runDryRun = async () => {
  try {
    await connectDB();

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "FORM → APPOINTMENT BACKFILL DRY RUN"
    );
    console.log(
      "======================================"
    );
    console.log("");

    /*
      We only analyse the original/root
      form.

      Additional payment records should
      not be treated as separate closed
      deals.
    */

    const forms = await FormDetail.find({
      parentFormId: null,
    })
      .select(
        [
          "_id",
          "userId",
          "date",
          "businessName",
          "mobileNumber",
          "googleMapLink",
          "paymentType",
          "sourcePresentationId",
        ].join(" ")
      )
      .lean();

    /*
      Get records that belong to the
      appointment lifecycle.
    */

    const presentations =
      await PresentationDetail.find({
        $or: [
          {
            status: "Appointment Fixed",
          },
          {
            isAppointment: true,
          },
          {
            isVisitedAppointment: true,
          },
          {
            rejectedFromAppointment: true,
          },
        ],
      })
        .select(
          [
            "_id",
            "userId",
            "date",
            "businessName",
            "contact",
            "mapLink",
            "status",
            "appointmentDate",
            "appointmentTime",
            "isVisitedAppointment",
            "visitedDate",
          ].join(" ")
        )
        .lean();

    /*
      Group appointments by BA/user.

      We intentionally do not automatically
      match a form belonging to one BA with
      another BA's appointment.
    */

    const presentationsByUser =
      new Map();

    presentations.forEach(
      (presentation) => {
        const userId = String(
          presentation.userId || ""
        );

        if (
          !presentationsByUser.has(
            userId
          )
        ) {
          presentationsByUser.set(
            userId,
            []
          );
        }

        presentationsByUser
          .get(userId)
          .push(presentation);
      }
    );

    const report = {
      generatedAt:
        new Date().toISOString(),

      totalRootForms: forms.length,

      alreadyLinked: [],

      confidentMatches: [],

      ambiguousMatches: [],

      unmatched: [],
    };

    for (const form of forms) {
      /*
        Do not touch forms that have already
        been linked manually/future records.
      */

      if (form.sourcePresentationId) {
        report.alreadyLinked.push({
          formId: String(form._id),

          sourcePresentationId:
            String(
              form.sourcePresentationId
            ),

          businessName:
            form.businessName || "",

          mobileNumber:
            form.mobileNumber || "",

          formDate:
            form.date || "",
        });

        continue;
      }

      const userId = String(
        form.userId || ""
      );

      const possibleAppointments =
        presentationsByUser.get(userId) ||
        [];

      const scoredCandidates =
        possibleAppointments
          .map((presentation) => {
            const result =
              scoreCandidate(
                form,
                presentation
              );

            return {
              presentation,

              score: result.score,

              identityMatches:
                result.identityMatches,

              reasons:
                result.reasons,
            };
          })
          .filter(
            (candidate) =>
              candidate.score > 0
          )
          .sort(
            (a, b) =>
              b.score - a.score
          );

      const best =
        scoredCandidates[0];

      const secondBest =
        scoredCandidates[1];

      const scoreMargin =
        best && secondBest
          ? best.score -
            secondBest.score
          : best
          ? best.score
          : 0;

      /*
        We deliberately require at least
        TWO identity matches.

        Example:
        Business + Phone
        Phone + Map
        Business + Map

        This keeps automatic matching
        conservative.
      */

      const isConfident =
        best &&
        best.score >=
          AUTO_MATCH_MIN_SCORE &&
        best.identityMatches >= 2 &&
        (
          !secondBest ||
          scoreMargin >=
            AUTO_MATCH_MIN_MARGIN
        );

      const formInfo = {
        formId:
          String(form._id),

        userId,

        businessName:
          form.businessName || "",

        mobileNumber:
          form.mobileNumber || "",

        googleMapLink:
          form.googleMapLink || "",

        formDate:
          form.date || "",
      };

      if (isConfident) {
        report.confidentMatches.push({
          ...formInfo,

          matchedPresentationId:
            String(
              best.presentation._id
            ),

          matchedBusinessName:
            best.presentation
              .businessName || "",

          matchedContact:
            best.presentation
              .contact || "",

          appointmentDate:
            best.presentation
              .appointmentDate || "",

          visitedDate:
            best.presentation
              .visitedDate || "",

          isVisitedAppointment:
            Boolean(
              best.presentation
                .isVisitedAppointment
            ),

          score:
            best.score,

          scoreMargin,

          reasons:
            best.reasons,
        });

        continue;
      }

      /*
        There is some reasonable candidate,
        but we do not trust it enough to
        update automatically.
      */

      if (
        best &&
        best.score >= 50
      ) {
        report.ambiguousMatches.push({
          ...formInfo,

          bestCandidates:
            scoredCandidates
              .slice(0, 3)
              .map((candidate) => ({
                presentationId:
                  String(
                    candidate
                      .presentation
                      ._id
                  ),

                businessName:
                  candidate
                    .presentation
                    .businessName ||
                  "",

                contact:
                  candidate
                    .presentation
                    .contact || "",

                appointmentDate:
                  candidate
                    .presentation
                    .appointmentDate ||
                  "",

                visitedDate:
                  candidate
                    .presentation
                    .visitedDate || "",

                score:
                  candidate.score,

                identityMatches:
                  candidate
                    .identityMatches,

                reasons:
                  candidate.reasons,
              })),
        });

        continue;
      }

      report.unmatched.push({
        ...formInfo,

        bestCandidate:
          best
            ? {
                presentationId:
                  String(
                    best.presentation._id
                  ),

                businessName:
                  best.presentation
                    .businessName || "",

                contact:
                  best.presentation
                    .contact || "",

                appointmentDate:
                  best.presentation
                    .appointmentDate || "",

                score:
                  best.score,

                reasons:
                  best.reasons,
              }
            : null,
      });
    }

    /*
      ----------------------------
      TERMINAL SUMMARY
      ----------------------------
    */

    console.log(
      `Root forms checked       : ${report.totalRootForms}`
    );

    console.log(
      `Already linked           : ${report.alreadyLinked.length}`
    );

    console.log(
      `Confident matches        : ${report.confidentMatches.length}`
    );

    console.log(
      `Ambiguous/manual review  : ${report.ambiguousMatches.length}`
    );

    console.log(
      `No reliable match        : ${report.unmatched.length}`
    );

    console.log("");

    /*
      ----------------------------
      SAVE REPORT
      ----------------------------

      IMPORTANT:
      This only writes a JSON report
      to your computer.

      It does NOT change MongoDB.
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

    const outputPath =
      path.join(
        outputDirectory,
        "form-appointment-backfill-dry-run.json"
      );

    await fs.writeFile(
      outputPath,
      JSON.stringify(
        report,
        null,
        2
      ),
      "utf8"
    );

    console.log(
      "Dry-run report saved:"
    );

    console.log(outputPath);

    console.log("");
    console.log(
      "NO DATABASE RECORDS WERE MODIFIED."
    );
    console.log("");
  } catch (error) {
    console.error(
      "Dry-run backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runDryRun();