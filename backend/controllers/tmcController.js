import TmcLog from "../models/TmcLog.js";

export const saveTmcLog = async (req, res) => {
  try {
    const {
      date,
      calls,
      presentations,
      appointmentsVisited,
      forms,
      revenue,
      manualNotes
    } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "Date is required"
      });
    }

    const incomingCalls =
      Array.isArray(calls) ? calls : [];

    const incomingPresentations =
      Array.isArray(presentations)
        ? presentations
        : [];

    const existingLog = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    if (existingLog) {
      /*
        Update calls individually.

        respondedAt changes only when the call's
        status, notes or callback date changes.
      */
      incomingCalls.forEach((incomingCall) => {
        const callNumber = Number(
          incomingCall.callNumber
        );

        const existingCall =
          existingLog.calls.find(
            (call) =>
              Number(call.callNumber) ===
              callNumber
          );

        const incomingStatus =
          String(incomingCall.status || "");

        const incomingNotes =
          String(incomingCall.notes || "");

        const incomingCallbackDate =
          String(
            incomingCall.callbackDate || ""
          );

        const incomingCallbackTime =
          String(
            incomingCall.callbackTime || ""
          );

        const incomingBusinessName =
          String(
            incomingCall.businessName || ""
          ).trim();

        if (!existingCall) {
          existingLog.calls.push({
            callNumber,
            businessName:
              incomingBusinessName,
            status: incomingStatus,
            notes: incomingNotes,
            callbackDate:
              incomingCallbackDate,

            callbackTime:
              incomingCallbackTime,

            respondedAt: new Date()
          });

          return;
        }

        const responseChanged =
          existingCall.status !==
            incomingStatus ||
          String(existingCall.notes || "") !==
            incomingNotes ||
          String(
            existingCall.callbackDate || ""
          ) !== incomingCallbackDate ||
          String(
            existingCall.callbackTime || ""
          ) !== incomingCallbackTime;

        const businessNameChanged =
          String(
            existingCall.businessName || ""
          ) !== incomingBusinessName;

        existingCall.status =
          incomingStatus;

        existingCall.notes =
          incomingNotes;

        existingCall.callbackDate =
          incomingCallbackDate;

        existingCall.callbackTime =
          incomingCallbackTime;

        if (businessNameChanged) {
          existingCall.businessName =
            incomingBusinessName;
        }

        if (responseChanged) {
          existingCall.respondedAt =
            new Date();
        }
      });

      /*
        Update presentations individually.

        respondedAt changes only when the
        presentation status or notes change.
      */
      incomingPresentations.forEach(
        (incomingPresentation) => {
          const presentationNumber =
            Number(
              incomingPresentation.presentationNumber
            );

          const existingPresentation =
            existingLog.presentations.find(
              (presentation) =>
                Number(
                  presentation.presentationNumber
                ) === presentationNumber
            );

          const incomingStatus =
            String(
              incomingPresentation.status || ""
            );

          const incomingNotes =
            String(
              incomingPresentation.notes || ""
            );

          const incomingBusinessName =
            String(
              incomingPresentation.businessName ||
                ""
            ).trim();

          if (!existingPresentation) {
            existingLog.presentations.push({
              presentationNumber,
              businessName:
                incomingBusinessName,
              status: incomingStatus,
              notes: incomingNotes,
              respondedAt: new Date()
            });

            return;
          }

          const responseChanged =
            existingPresentation.status !==
              incomingStatus ||
            String(
              existingPresentation.notes || ""
            ) !== incomingNotes;

          const businessNameChanged =
            String(
              existingPresentation.businessName ||
                ""
            ) !== incomingBusinessName;

          existingPresentation.status =
            incomingStatus;

          existingPresentation.notes =
            incomingNotes;

          if (businessNameChanged) {
            existingPresentation.businessName =
              incomingBusinessName;
          }

          if (responseChanged) {
            existingPresentation.respondedAt =
              new Date();
          }
        }
      );

      existingLog.appointmentsVisited =
        appointmentsVisited ??
        existingLog.appointmentsVisited;

      existingLog.forms =
        forms ?? existingLog.forms;

      existingLog.revenue =
        revenue ?? existingLog.revenue;

      existingLog.manualNotes =
        manualNotes ??
        existingLog.manualNotes;

      await existingLog.save();

      return res.status(200).json({
        message:
          "TMC data updated successfully",
        data: existingLog
      });
    }

    const currentTime = new Date();

    const preparedCalls =
      incomingCalls.map((call) => ({
        callNumber: Number(
          call.callNumber
        ),

        businessName: String(
          call.businessName || ""
        ).trim(),

        status: call.status,

        notes: call.notes || "",

        callbackDate:
          call.callbackDate || "",

        callbackTime:
          call.callbackTime || "",

        respondedAt: currentTime
      }));

    const preparedPresentations =
      incomingPresentations.map(
        (presentation) => ({
          presentationNumber: Number(
            presentation.presentationNumber
          ),

          businessName: String(
            presentation.businessName || ""
          ).trim(),

          status: presentation.status,

          notes:
            presentation.notes || "",

          respondedAt: currentTime
        })
      );

    const newLog = await TmcLog.create({
      userId: req.user.id,
      date,
      calls: preparedCalls,
      presentations:
        preparedPresentations,
      appointmentsVisited:
        appointmentsVisited || 0,
      forms: forms || 0,
      revenue: revenue || 0,
      manualNotes: manualNotes || ""
    });

    res.status(201).json({
      message:
        "TMC data saved successfully",
      data: newLog
    });
  } catch (error) {
    console.error(
      "saveTmcLog error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

export const getTmcLogByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const log = await TmcLog.findOne({
      userId: req.user.id,
      date
    });

    if (!log) {
      return res.status(200).json({
        calls: [],
        presentations: [],
        appointmentsVisited: 0,
        forms: 0,
        revenue: 0
      });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCallBackPresentations = async (req, res) => {
  try {
    const {
      month = "all",
      weekStart = "",
      weekEnd = ""
    } = req.query;

    const filter = {
      userId: req.user.id,
      "calls.status": "CBP"
    };

    // Week-wise filter
    if (weekStart && weekEnd) {
      filter.date = {
        $gte: weekStart,
        $lte: weekEnd
      };
    }
    // Month-wise filter
    else if (month && month !== "all") {
      filter.date = { $regex: `^${month}` };
    }

    const logs = await TmcLog.find(filter).sort({
      date: -1,
      createdAt: -1
    });

    const records = [];

    logs.forEach((log) => {
      log.calls
        .filter((call) => call.status === "CBP")
        .forEach((call) => {
          records.push({
            _id: `${log._id}-${call.callNumber}`,
            logId: log._id,
            date: log.date,
            callbackDate:
            call.callbackDate || "",

            callbackTime:
              call.callbackTime || "",

            callNumber: call.callNumber,
            status: call.status,
            notes: call.notes || ""
          });
        });
    });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCallBackPresentation = async (req, res) => {
  try {
    const { logId, callNumber } = req.params;

    const updatedLog = await TmcLog.findOneAndUpdate(
      {
        _id: logId,
        userId: req.user.id
      },
      {
        $pull: {
          calls: {
            callNumber: Number(callNumber),
            status: "CBP"
          }
        }
      },
      { new: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 

export const updateCallBackPresentationManualNote = async (req, res) => {
  try {
    const { logId, callNumber } = req.params;
    const { manualNote } = req.body;

    const log = await TmcLog.findOne({
      _id: logId,
      userId: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: "TMC log not found" });
    }

    const call = log.calls.find(
      (item) =>
        Number(item.callNumber) === Number(callNumber) &&
        item.status === "CBP"
    );

    if (!call) {
      return res.status(404).json({ message: "Callback presentation not found" });
    }

    const notes = call.notes || "";

    const baseNotes = notes.includes("Manual Note:")
      ? notes.split("Manual Note:")[0].trim()
      : notes.trim();

    call.notes = `${baseNotes}\nManual Note: ${manualNote || ""}`;

    await log.save();

    res.status(200).json({
      message: "Manual note updated successfully",
      notes: call.notes
    });
  } catch (error) {
    console.error("updateCallBackPresentationManualNote error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCallBackPresentationDate = async (
  req,
  res
) => {
  try {
    const {
      logId,
      callNumber
    } = req.params;

    const {
      callbackDate,
      callbackTime
    } = req.body;

    const updateFields = {
      "calls.$.callbackDate":
        callbackDate || ""
    };

    /*
      Preserve the existing time when an
      older frontend sends only the date.
    */
    if (
      callbackTime !== undefined
    ) {
      updateFields[
        "calls.$.callbackTime"
      ] = callbackTime || "";
    }

    const updatedLog =
      await TmcLog.findOneAndUpdate(
        {
          _id: logId,
          userId: req.user.id,
          calls: {
            $elemMatch: {
              callNumber:
                Number(callNumber),
              status: "CBP"
            }
          }
        },
        {
          $set: updateFields
        },
        {
          new: true
        }
      );

    if (!updatedLog) {
      return res.status(404).json({
        message:
          "Callback presentation record not found"
      });
    }

    const updatedCall =
      updatedLog.calls.find(
        (call) =>
          Number(call.callNumber) ===
          Number(callNumber)
      );

    res.status(200).json({
      message:
        "Callback presentation schedule updated successfully",

      callbackDate:
        updatedCall?.callbackDate || "",

      callbackTime:
        updatedCall?.callbackTime || ""
    });
  } catch (error) {
    console.error(
      "updateCallBackPresentationDate error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};