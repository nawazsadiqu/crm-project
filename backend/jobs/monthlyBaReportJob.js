import cron from "node-cron";
import { sendMonthlyBaReports } from "../utils/sendMonthlyBaReports.js";

console.log("Monthly BA report cron file loaded");

cron.schedule("0 9 1 * *", async () => {
  try {
    console.log("Monthly BA report job started");

    await sendMonthlyBaReports();

    console.log("Monthly BA report job completed");
  } catch (error) {
    console.error("Monthly BA report job failed:", error); 
  }
});