import cron from "node-cron";
import {
    sendDailyAppointmentEmail
} from "../utils/sendDailyAppointmentEmail.js";

console.log(
    "Daily appointment email cron loaded"
);

/*
  Every day at 8:00 AM India time.
*/
cron.schedule(
    "0 9 * * *",
    async () => {
        try {
            console.log(
                "Daily appointment email job started"
            );

            await sendDailyAppointmentEmail();

            console.log(
                "Daily appointment email job completed"
            );
        } catch (error) {
            console.error(
                "Daily appointment email job failed:",
                error
            );
        }
    },
    {
        timezone: "Asia/Kolkata"
    }
);