
import cron from "node-cron";

import {
    sendDailyAppointmentResultEmail
} from "../utils/sendDailyAppointmentResultEmail.js";

console.log(
    "Daily Fixed vs Result email cron loaded (9:00 PM IST)"
);

cron.schedule(
    "0 21 * * *",
    async () => {
        try {
            console.log(
                "Daily Fixed vs Result email job started"
            );

            await sendDailyAppointmentResultEmail();

            console.log(
                "Daily Fixed vs Result email job completed"
            );
        } catch (error) {
            console.error(
                "Daily Fixed vs Result email job failed:",
                error
            );
        }
    },
    {
        timezone: "Asia/Kolkata"
    }
);
