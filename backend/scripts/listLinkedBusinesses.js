import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import FormDetail from "../models/FormDetail.js";
import "../models/User.js";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    await connectDB();

    const linkedForms = await FormDetail.find({
      parentFormId: null,

      sourcePresentationId: {
        $ne: null
      }
    })
      .select(
        "businessName mobileNumber date sourcePresentationId userId"
      )
      .populate(
        "userId",
        "name email employeeId"
      )
      .sort({
        date: -1
      })
      .lean();

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "LINKED BUSINESS / CLOSED DEALS"
    );
    console.log(
      "========================================"
    );
    console.log("");

    console.log(
      `Total Linked Businesses: ${linkedForms.length}`
    );

    console.log("");

    linkedForms.forEach(
      (item, index) => {
        console.log(
          `${index + 1}. ${item.businessName || "-"}`
        );

        console.log(
          `   Contact     : ${item.mobileNumber || "-"}`
        );

        console.log(
          `   Form Date   : ${item.date || "-"}`
        );

        console.log(
          `   BA          : ${item.userId?.name || "-"}`
        );

        console.log(
          `   Appointment : ${item.sourcePresentationId}`
        );

        console.log("");
      }
    );
  } catch (error) {
    console.error(
      "Failed to list linked businesses:",
      error
    );
  } finally {
    await mongoose.disconnect();
  }
};

run();