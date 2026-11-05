import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

import {
  sendDailyAppointmentEmail
} from "../utils/sendDailyAppointmentEmail.js";

dotenv.config({
  path: "./.env"
});

const test = async () => {
  try {
    await connectDB();

    console.log(
      "Testing daily appointment email..."
    );

    await sendDailyAppointmentEmail();

    console.log(
      "Test email completed successfully"
    );
  } catch (error) {
    console.error(
      "Test email failed:",
      error
    );
  } finally {
    await mongoose.disconnect();
  }
};

test();