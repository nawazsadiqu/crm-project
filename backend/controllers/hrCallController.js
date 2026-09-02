import HrCallLog from "../models/HrCallLog.js";
import HrCandidatePipeline from "../models/HrCandidatePipeline.js";

const allowedStatuses = [
  "INTERESTED",
  "NOT_INTERESTED",
  "NOT_SELECTED",
  "CALL_BACK",
  "NOT_LIFTING",
  "NOT_CONNECTED",
];

export const saveHrCallLog = async (req, res) => {
  try {
    const { date, call, calls } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    /*
     * Support the new single-call request.
     * The calls array is temporarily supported for older frontend versions.
     */
    const incomingCalls = call
      ? [call]
      : Array.isArray(calls)
      ? calls
      : [];

    if (incomingCalls.length === 0) {
      return res.status(400).json({
        message: "Call data is required",
      });
    }

    const normalizedCalls = [];

    for (const incomingCall of incomingCalls) {
      const callNumber =
  Number(incomingCall.callNumber);

const status =
  incomingCall.status;

const notes =
  String(
    incomingCall.notes || ""
  ).trim();

const callingDataId =
  incomingCall.callingDataId || null;

const candidateName =
  String(
    incomingCall.candidateName || ""
  ).trim();

const contactNumber =
  String(
    incomingCall.contactNumber || ""
  ).trim();

const qualification =
  String(
    incomingCall.qualification || ""
  ).trim();

const location =
  String(
    incomingCall.location || ""
  ).trim();

const experience =
  String(
    incomingCall.experience || ""
  ).trim();

      if (
        !Number.isInteger(callNumber) ||
        callNumber < 1 ||
        callNumber > 150
      ) {
        return res.status(400).json({
          message: "Call number must be between 1 and 150",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid call status",
        });
      }

      normalizedCalls.push({
  callNumber,
  status,
  notes,

  callingDataId,

  candidateName,
  contactNumber,
  qualification,
  location,
  experience,
});
    }

    let existingLog = await HrCallLog.findOne({
      userId: req.user.id,
      date,
    });

    if (!existingLog) {
      existingLog = await HrCallLog.create({
        userId: req.user.id,
        date,
        calls: normalizedCalls,
      });

      return res.status(201).json({
        message: "HR call saved successfully",
        data: existingLog,
      });
    }

    /*
     * Preserve every call already stored in MongoDB.
     * Only insert or update the submitted call number.
     */
    const callsByNumber = new Map();

    existingLog.calls.forEach((existingCall) => {
      const plainCall =
        typeof existingCall.toObject === "function"
          ? existingCall.toObject()
          : existingCall;

      callsByNumber.set(
        Number(existingCall.callNumber),
        plainCall
      );
    });

    normalizedCalls.forEach((incomingCall) => {
  const previousCall =
    callsByNumber.get(
      incomingCall.callNumber
    );

  callsByNumber.set(
    incomingCall.callNumber,
    {
      ...(previousCall || {}),

      callNumber:
        incomingCall.callNumber,

      status:
        incomingCall.status,

      notes:
        incomingCall.notes,

      callingDataId:
        incomingCall.callingDataId ||
        previousCall?.callingDataId ||
        null,

      candidateName:
        incomingCall.candidateName ||
        previousCall?.candidateName ||
        "",

      contactNumber:
        incomingCall.contactNumber ||
        previousCall?.contactNumber ||
        "",

      qualification:
        incomingCall.qualification ||
        previousCall?.qualification ||
        "",

      location:
        incomingCall.location ||
        previousCall?.location ||
        "",

      experience:
        incomingCall.experience ||
        previousCall?.experience ||
        "",
    }
  );
});

    existingLog.calls = Array.from(
      callsByNumber.values()
    ).sort((a, b) => a.callNumber - b.callNumber);

    await existingLog.save();

    res.status(200).json({
      message: "HR call updated successfully",
      data: existingLog,
    });
  } catch (error) {
    console.error("Save HR call error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getHrCallLogByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const log = await HrCallLog.findOne({
      userId: req.user.id,
      date
    });

    if (!log) {
      return res.status(200).json({
        calls: []
      });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHrCallSummary = async (
  req,
  res
) => {
  try {
    const {
      date,
      type = "daily",
    } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    let startDate = date;
    let endDate = date;

    const selectedDate =
      new Date(date);

    /*
     * Weekly range
     */
    if (type === "weekly") {
      const day =
        selectedDate.getDay();

      const mondayOffset =
        day === 0
          ? -6
          : 1 - day;

      const monday =
        new Date(selectedDate);

      monday.setDate(
        selectedDate.getDate() +
          mondayOffset
      );

      const sunday =
        new Date(monday);

      sunday.setDate(
        monday.getDate() + 6
      );

      startDate =
        monday
          .toISOString()
          .split("T")[0];

      endDate =
        sunday
          .toISOString()
          .split("T")[0];
    }

    /*
     * Monthly range
     */
    if (type === "monthly") {
      const year =
        selectedDate.getFullYear();

      const month =
        selectedDate.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const lastDay =
        new Date(
          year,
          month + 1,
          0
        );

      startDate =
        firstDay
          .toISOString()
          .split("T")[0];

      endDate =
        lastDay
          .toISOString()
          .split("T")[0];
    }

    /*
     * Call logs for selected HR
     */
    const logs =
      await HrCallLog.find({
        userId: req.user.id,

        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).lean();

    const summary = {
      total: 0,
      interested: 0,
      notInterested: 0,
      notSelected: 0,
      callBack: 0,
      notLifting: 0,
      notConnected: 0,

      resumeGot: 0,
      firstRound: 0,
      secondRound: 0,
    };

    /*
     * Details shown when cards
     * are clicked.
     */
    const details = {
      total: [],
      interested: [],
      notInterested: [],
      notSelected: [],
      callBack: [],
      notLifting: [],
      notConnected: [],

      resumeGot: [],
      firstRound: [],
      secondRound: [],
    };

    const statusKeyMap = {
      INTERESTED:
        "interested",

      NOT_INTERESTED:
        "notInterested",

      NOT_SELECTED:
        "notSelected",

      CALL_BACK:
        "callBack",

      NOT_LIFTING:
        "notLifting",

      NOT_CONNECTED:
        "notConnected",
    };

    /*
     * Build call counts +
     * call detail lists.
     */
    logs.forEach((log) => {
      log.calls.forEach(
        (call) => {
          const detail = {
            date:
              log.date || "",

            callNumber:
              call.callNumber || "",

            candidateName:
              call.candidateName ||
              "",

            contactNumber:
              call.contactNumber ||
              "",

            qualification:
              call.qualification ||
              "",

            location:
              call.location ||
              "",

            experience:
              call.experience ||
              "",

            status:
              call.status || "",

            notes:
              call.notes || "",
          };

          summary.total += 1;

          details.total.push(
            detail
          );

          const key =
            statusKeyMap[
              call.status
            ];

          if (key) {
            summary[key] += 1;

            details[key].push(
              detail
            );
          }
        }
      );
    });

    /*
     * Resume Got candidates
     * for selected period.
     */
    const resumeGotCandidates =
      await HrCandidatePipeline.find({
        resumeGot: "Yes",

        resumeGotBy:
          req.user.id,

        resumeGotDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .select(
          [
            "candidateName",
            "contactNumber",
            "jobPortal",
            "qualification",
            "location",
            "experience",
            "resumeGotDate",
          ].join(" ")
        )
        .lean();

    /*
     * First Round candidates
     */
    const firstRoundCandidates =
      await HrCandidatePipeline.find({
        firstRoundAttended:
          true,

        firstRoundAttendedBy:
          req.user.id,

        firstRoundAttendedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .select(
          [
            "candidateName",
            "contactNumber",
            "jobPortal",
            "qualification",
            "location",
            "experience",
            "firstRoundAttendedDate",
          ].join(" ")
        )
        .lean();

    /*
     * Second Round candidates
     */
    const secondRoundCandidates =
      await HrCandidatePipeline.find({
        secondRoundSelected:
          true,

        secondRoundAttendedBy:
          req.user.id,

        secondRoundAttendedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .select(
          [
            "candidateName",
            "contactNumber",
            "jobPortal",
            "qualification",
            "location",
            "experience",
            "secondRoundAttendedDate",
          ].join(" ")
        )
        .lean();

    /*
     * Convert pipeline documents
     * into modal-friendly objects.
     */
    details.resumeGot =
      resumeGotCandidates.map(
        (candidate) => ({
          date:
            candidate.resumeGotDate ||
            "",

          callNumber: "",

          candidateName:
            candidate.candidateName ||
            "",

          contactNumber:
            candidate.contactNumber ||
            "",

          jobPortal:
            candidate.jobPortal ||
            "",

          qualification:
            candidate.qualification ||
            "",

          location:
            candidate.location ||
            "",

          experience:
            candidate.experience ||
            "",
        })
      );

    details.firstRound =
      firstRoundCandidates.map(
        (candidate) => ({
          date:
            candidate.firstRoundAttendedDate ||
            "",

          callNumber: "",

          candidateName:
            candidate.candidateName ||
            "",

          contactNumber:
            candidate.contactNumber ||
            "",

          jobPortal:
            candidate.jobPortal ||
            "",

          qualification:
            candidate.qualification ||
            "",

          location:
            candidate.location ||
            "",

          experience:
            candidate.experience ||
            "",
        })
      );

    details.secondRound =
      secondRoundCandidates.map(
        (candidate) => ({
          date:
            candidate.secondRoundAttendedDate ||
            "",

          callNumber: "",

          candidateName:
            candidate.candidateName ||
            "",

          contactNumber:
            candidate.contactNumber ||
            "",

          jobPortal:
            candidate.jobPortal ||
            "",

          qualification:
            candidate.qualification ||
            "",

          location:
            candidate.location ||
            "",

          experience:
            candidate.experience ||
            "",
        })
      );

    summary.resumeGot =
      details.resumeGot.length;

    summary.firstRound =
      details.firstRound.length;

    summary.secondRound =
      details.secondRound.length;

    res.json({
      ...summary,

      details,

      type,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error(
      "Get HR call summary error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};