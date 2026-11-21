
import cron from "node-cron";

import {
    sendDailyAppointmentEmail
} from "../utils/sendDailyAppointmentEmail.js";

console.log(
    "Tomorrow's appointment email cron loaded (9:00 PM IST)"
);

/*
  Every day at 9:00 PM IST.

  The report includes appointments
  scheduled for the next day.
*/

cron.schedule(
    "0 21 * * *",
    async () => {
        try {
            console.log(
                "Tomorrow's appointment email job started"
            );

            await sendDailyAppointmentEmail();

            console.log(
                "Tomorrow's appointment email job completed"
            );
        } catch (error) {
            console.error(
                "Tomorrow's appointment email job failed:",
                error
            );
        }
    },
    {
        timezone: "Asia/Kolkata"
    }
);
