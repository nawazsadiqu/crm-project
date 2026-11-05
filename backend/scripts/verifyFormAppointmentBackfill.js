import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import FormDetail from "../models/FormDetail.js";

dotenv.config({ path: "./.env" });

const verify = async () => {
  try {
    await connectDB();

    const totalRootForms =
      await FormDetail.countDocuments({
        parentFormId: null,
      });

    const linkedRootForms =
      await FormDetail.countDocuments({
        parentFormId: null,
        sourcePresentationId: {
          $ne: null,
        },
      });

    const unlinkedRootForms =
      await FormDetail.countDocuments({
        parentFormId: null,

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
      });

    console.log("");
    console.log(
      "FORM → APPOINTMENT LINK VERIFICATION"
    );
    console.log("");

    console.log(
      `Total root forms   : ${totalRootForms}`
    );

    console.log(
      `Linked forms       : ${linkedRootForms}`
    );

    console.log(
      `Unlinked forms     : ${unlinkedRootForms}`
    );

    console.log("");
  } catch (error) {
    console.error(
      "Verification failed:",
      error
    );
  } finally {
    await mongoose.disconnect();
  }
};

verify();