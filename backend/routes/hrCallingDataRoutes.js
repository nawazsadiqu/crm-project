import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

import HrCallingData from "../models/HrCallingData.js";
import HrCandidatePipeline from "../models/HrCandidatePipeline.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const clean = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const getTodayIndia = () => {
  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );

  return formatter.format(new Date());
};

router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const results = [];
    const uploadBatch = Number(req.body.uploadBatch || 1);

    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
  const candidateName = clean(
    row.candidateName ||
      row["Candidate Name"] ||
      row["Name"]
  );

  const contactNumber = clean(
    row.contactNumber ||
      row["Contact Number"] ||
      row["Contact"] ||
      row["Contact No"] ||
      row["Mobile"] ||
      row["Mobile Number"] ||
      row["Phone"] ||
      row["Phone Number"] ||
      row["Number"]
  );

  const jobPortal = clean(
    row.jobPortal ||
      row["Job Portal"] ||
      row["Job portal"] ||
      row["JobPortal"] ||
      row["Job Source"] ||
      row["Platform"] ||
      row["Portal"] ||
      row["Source"]
  );

  const qualification = clean(
    row.qualification ||
      row["Qualification"]
  );

  const location = clean(
    row.location ||
      row["Location"]
  );

  const experience = clean(
    row.experience ||
      row["Experience"]
  );

  const notes = clean(
    row.notes ||
      row["Notes"]
  );

  /*
   * Ignore completely empty CSV rows.
   * A serial number alone does not make
   * a row valid calling data.
   */
  const hasCandidateData = Boolean(
    candidateName ||
      contactNumber ||
      jobPortal ||
      qualification ||
      location ||
      experience ||
      notes
  );

  if (!hasCandidateData) {
    return;
  }

  results.push({
    uploadBatch,

    // Renumber only actual records.
    serialNumber:
      results.length + 1,

    candidateName,
    contactNumber,
    jobPortal,
    qualification,
    location,
    experience,
    notes,

    uploadedBy:
      req.user?._id ||
      req.user?.id,
  });
})
      .on("end", async () => {
  try {
    if (results.length === 0) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        message: "The CSV file does not contain valid records",
      });
    }

    // Get all previous calling-data IDs from this exact slot.
    const previousCallingData =
      await HrCallingData.find({
        uploadBatch,
      }).select("_id");

    const previousCallingDataIds =
      previousCallingData.map((item) => item._id);

    // Remove only non-interested pipeline records
    // connected to the previous calling-data slot.
    //
    // Interested candidates must be preserved
    // so monthly Interested Candidate history remains available.
    if (previousCallingDataIds.length > 0) {
      await HrCandidatePipeline.deleteMany({
        sourceCallingDataId: {
          $in: previousCallingDataIds,
        },

        interestedCandidate: {
          $ne: true,
        },

        lastResponseCode: {
          $ne: "INTERESTED",
        },
      });
    }

    // Permanently delete all previous records from this slot.
    await HrCallingData.deleteMany({
      uploadBatch,
    });

    // Insert only the newly uploaded CSV data.
    await HrCallingData.insertMany(results);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      message:
        `Data ${uploadBatch} replaced successfully with ` +
        `${results.length} new records`,
      count: results.length,
      uploadBatch,
    });
  } catch (error) {
    console.error(
      "Replace HR calling data error:",
      error
    );

    if (
      req.file?.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: error.message,
    });
  }
})
      .on("error", (error) => {
        console.error("CSV read error:", error);
        res.status(500).json({ message: "Failed to read CSV file" });
      });
  } catch (error) {
    console.error("HR calling data upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/manual-call-response",
  protect,
  async (req, res) => {
    try {
      const {
        candidateName,
        contactNumber,
        qualification,
        location,
        experience,
        response,
        responseCode,
        notes,
        callNumber,
        date,
      } = req.body;

      if (!response) {
        return res.status(400).json({
          message:
            "Response is required",
        });
      }

      /*
       * Create a calling-data record for
       * a candidate entered manually from
       * HR Call Tracking.
       *
       * uploadBatch 0 keeps these manual
       * records away from CSV Data 1-4.
       */
      const data =
        await HrCallingData.create({
          serialNumber: 0,
          uploadBatch: 0,

          candidateName:
            candidateName || "",

          contactNumber:
            contactNumber || "",

          qualification:
            qualification || "",

          location:
            location || "",

          experience:
            experience || "",

          notes:
            notes || "",

          response1:
            response,

          response1Date:
            date || "",

          lastResponse:
            response,

          lastResponseCode:
            responseCode || "",

          lastResponseDate:
            date || "",

          lastCallNumber:
            Number(callNumber) || 0,

          uploadedBy:
            req.user?._id ||
            req.user?.id,
        });

      const pipelineCreationStatuses = [
        "INTERESTED",
        "CALL_BACK",
        "NOT_LIFTING",
        "NOT_CONNECTED",
      ];

      const shouldCreatePipeline =
        pipelineCreationStatuses.includes(
          responseCode
        );

      if (shouldCreatePipeline) {
        const isInterested =
          responseCode ===
          "INTERESTED";

        await HrCandidatePipeline.create({
          sourceCallingDataId:
            data._id,

          uploadedBy:
            data.uploadedBy,

          candidateName:
            data.candidateName || "",

          contactNumber:
            data.contactNumber || "",

          jobPortal: "",

          qualification:
            data.qualification || "",

          location:
            data.location || "",

          experience:
            data.experience || "",

          notes:
            data.notes || "",

          lastResponse:
            data.lastResponse || "",

          lastResponseCode:
            data.lastResponseCode || "",

          lastResponseDate:
            data.lastResponseDate || "",

          lastCallNumber:
            data.lastCallNumber || 0,

          interestedCandidate:
            isInterested,

          interestedAt:
            isInterested
              ? date
                ? new Date(
                    `${date}T00:00:00.000Z`
                  )
                : new Date()
              : null,
        });
      }

      res.status(201).json({
        message:
          "Manual HR candidate saved successfully",
        data,
      });
    } catch (error) {
      console.error(
        "Save manual HR candidate error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get("/", protect, async (req, res) => {
  try {
    const uploadBatch = Number(req.query.uploadBatch || 1);

    const data = await HrCallingData.find({
      isDeleted: false,
      uploadBatch,
    }).sort({
      serialNumber: 1,
      createdAt: 1,
    });

    res.json(data);
  } catch (error) {
    console.error("Fetch HR calling data error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/interested-candidates", protect, async (req, res) => {
  try {
    const { month } = req.query;

const interestedCandidatesFilter = {
  $or: [
    {
      interestedCandidate: true,
    },
    {
      interestedCandidate: {
        $exists: false,
      },
      lastResponseCode: "INTERESTED",
    },
  ],
};

let candidateQuery =
  interestedCandidatesFilter;

if (month) {
  const monthMatch =
    String(month).match(
      /^(\d{4})-(\d{2})$/
    );

  if (!monthMatch) {
    return res.status(400).json({
      message:
        "Month must be in YYYY-MM format",
    });
  }

  const year =
    Number(monthMatch[1]);

  const monthNumber =
    Number(monthMatch[2]);

  if (
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return res.status(400).json({
      message: "Invalid month",
    });
  }

  const startDate =
    new Date(
      Date.UTC(
        year,
        monthNumber - 1,
        1
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        year,
        monthNumber,
        1
      )
    );

  candidateQuery = {
    $and: [
      interestedCandidatesFilter,

      {
        $or: [
          /*
           * New records:
           * use the exact date on which
           * the candidate became Interested.
           */
          {
            interestedAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },

          /*
           * Old records created before
           * interestedAt existed.
           *
           * createdAt is only a fallback.
           */
          {
            interestedAt: null,

            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        ],
      },
    ],
  };
}

const pipelineCandidates =
  await HrCandidatePipeline.find(
    candidateQuery
  )
    .sort({
      interestedAt: -1,
      createdAt: -1,
    })
    .lean();

    const sourceCallingDataIds = pipelineCandidates
      .map((candidate) => candidate.sourceCallingDataId)
      .filter(Boolean);

    const callingDataRecords = await HrCallingData.find({
      _id: {
        $in: sourceCallingDataIds,
      },
    })
      .select(
        [
          "jobPortal",
          "response1",
          "response1Date",
          "response2",
          "response2Date",
          "response3",
          "response3Date",
          "response4",
          "response4Date",
          "response5",
          "response5Date",
          "lastResponse",
          "lastResponseDate",
        ].join(" ")
      )
      .lean();

    const callingDataMap = new Map(
      callingDataRecords.map((record) => [
        String(record._id),
        record,
      ])
    );

    const data = pipelineCandidates.map((candidate) => {
      const callingData = callingDataMap.get(
        String(candidate.sourceCallingDataId)
      );

      return {
        ...candidate,

        jobPortal:
          callingData?.jobPortal ||
          candidate.jobPortal ||
          "",

        response1: callingData?.response1 || "",
        response1Date: callingData?.response1Date || "",

        response2: callingData?.response2 || "",
        response2Date: callingData?.response2Date || "",

        response3: callingData?.response3 || "",
        response3Date: callingData?.response3Date || "",

        response4: callingData?.response4 || "",
        response4Date: callingData?.response4Date || "",

        response5: callingData?.response5 || "",
        response5Date: callingData?.response5Date || "",

        lastResponse:
          callingData?.lastResponse ||
          candidate.lastResponse ||
          "",

        lastResponseDate:
          callingData?.lastResponseDate ||
          candidate.lastResponseDate ||
          "",
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Fetch interested candidates error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/callback-candidates", protect, async (req, res) => {
  try {
    const data = await HrCandidatePipeline.find({
      lastResponseCode: {
        $in: ["CALL_BACK", "NOT_LIFTING", "NOT_CONNECTED"],
      },
    }).sort({ updatedAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("Fetch callback candidates error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/scheduled-interviews", protect, async (req, res) => {
    try {
      const data =
        await HrCandidatePipeline.find({
          interview: true,

          interviewDate: {
            $ne: "",
          },
        }).sort({
          interviewDate: 1,
          updatedAt: -1,
        });

      res.json(data);
    } catch (error) {
      console.error(
        "Fetch scheduled interviews error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get("/first-round-candidates", protect, async (req, res) => {
    try {
      const data =
        await HrCandidatePipeline.find({
          firstRoundAttended: true,
        }).sort({
          updatedAt: -1,
        });

      res.json(data);
    } catch (error) {
      console.error(
        "Fetch first round candidates error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get("/second-round-candidates", protect, async (req, res) => {
    try {
      const data =
        await HrCandidatePipeline.find({
          secondRoundSelected: true,
        }).sort({
          updatedAt: -1,
        });

      res.json(data);
    } catch (error) {
      console.error(
        "Fetch second round candidates error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get("/resume-got-candidates", protect, async (req, res) => {
    try {
      const data =
        await HrCandidatePipeline.find({
          resumeGot: "Yes",
        }).sort({
          updatedAt: -1,
        });

      res.json(data);
    } catch (error) {
      console.error(
        "Fetch resume got candidates error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get("/joined-candidates", protect, async (req, res) => {
    try {
      const data =
        await HrCandidatePipeline.find({
          joined: true,
        }).sort({
          joinedDate: -1,
          updatedAt: -1,
        });

      res.json(data);
    } catch (error) {
      console.error(
        "Fetch joined candidates error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.patch("/:id/interview-details", protect, async (req, res) => {
    try {
      const {
        resumeGot,
        interview,
        interviewDate,
      } = req.body;

      const candidate =
        await HrCandidatePipeline.findById(
          req.params.id
        );

      if (!candidate) {
        return res.status(404).json({
          message: "Candidate not found",
        });
      }

      /*
       * Resume Got stage
       */
      if (
        resumeGot !== undefined
      ) {
        const newResumeGot =
          resumeGot || "";

        if (
          newResumeGot === "Yes"
        ) {
          /*
           * Save the first date on which
           * Resume Got was marked Yes.
           */
          if (
            candidate.resumeGot !==
              "Yes" ||
            !candidate.resumeGotDate
          ) {
            candidate.resumeGotDate =
              getTodayIndia();

            candidate.resumeGotBy =
              req.user?._id ||
              req.user?.id;
          }
        } else {
          /*
           * If HR corrects the status
           * back to No/blank, remove
           * the stage date as well.
           */
          candidate.resumeGotDate = "";
          candidate.resumeGotBy = null;
        }

        candidate.resumeGot =
          newResumeGot;
      }

      /*
       * Interview scheduling
       */
      if (
        interview !== undefined
      ) {
        candidate.interview =
          Boolean(interview);

        candidate.interviewDate =
          Boolean(interview)
            ? interviewDate || ""
            : "";
      }

      await candidate.save();

      res.json({
        message:
          "Interview details updated successfully",
        data: candidate,
      });
    } catch (error) {
      console.error(
        "Update interview details error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.patch("/:id/interview-stage", protect, async (req, res) => {
  try {
    const {
      firstRoundAttended,
      secondRoundSelected,
      joined,
      joinedDate,
    } = req.body;

    const candidate =
      await HrCandidatePipeline.findById(
        req.params.id
      );

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    /*
     * Scheduled Interview
     * -> First Round
     */
    if (
  typeof firstRoundAttended ===
  "boolean"
) {
  if (firstRoundAttended) {
    if (
      !candidate.firstRoundAttended ||
      !candidate.firstRoundAttendedDate
    ) {
      candidate.firstRoundAttendedDate =
        getTodayIndia();

      candidate.firstRoundAttendedBy =
        req.user?._id ||
        req.user?.id;
    }
  } else {
    candidate.firstRoundAttendedDate =
      "";

    candidate.firstRoundAttendedBy =
      null;

    candidate.secondRoundSelected =
      false;

    candidate.secondRoundAttendedDate =
      "";

    candidate.secondRoundAttendedBy =
      null;

    candidate.joined = false;
    candidate.joinedDate = "";
  }

  candidate.firstRoundAttended =
    firstRoundAttended;
}

    /*
     * First Round
     * -> Second Round
     */
    if (
  typeof secondRoundSelected ===
  "boolean"
) {
  if (
    secondRoundSelected &&
    !candidate.firstRoundAttended
  ) {
    return res.status(400).json({
      message:
        "Candidate must attend the first round before moving to the second round",
    });
  }

  if (secondRoundSelected) {
    if (
      !candidate.secondRoundSelected ||
      !candidate.secondRoundAttendedDate
    ) {
      candidate.secondRoundAttendedDate =
        getTodayIndia();

      candidate.secondRoundAttendedBy =
        req.user?._id ||
        req.user?.id;
    }
  } else {
    candidate.secondRoundAttendedDate =
      "";

    candidate.secondRoundAttendedBy =
      null;

    candidate.joined = false;
    candidate.joinedDate = "";
  }

  candidate.secondRoundSelected =
    secondRoundSelected;
}

    /*
     * Second Round
     * -> Joined
     */
    if (typeof joined === "boolean") {
  if (
    joined &&
    !candidate.secondRoundSelected
  ) {
    return res.status(400).json({
      message:
        "Candidate must complete the second round before being marked as joined",
    });
  }

  if (joined) {
    if (
      !joinedDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        joinedDate
      )
    ) {
      return res.status(400).json({
        message:
          "Joined date is required",
      });
    }

    candidate.joined = true;
    candidate.joinedDate =
      joinedDate;
  } else {
    candidate.joined = false;
    candidate.joinedDate = "";
  }
}

    await candidate.save();

    res.json({
      message:
        "Interview stage updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.error(
      "Update interview stage error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
});

router.patch("/:id/notes", protect, async (req, res) => {
  try {
    const { notes } = req.body;

    const data = await HrCandidatePipeline.findByIdAndUpdate(
      req.params.id,
      {
        notes: notes || "",
      },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json({
      message: "Notes updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update HR candidate notes error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const data = await HrCallingData.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!data) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Fetch single HR calling data error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/call-response", protect, async (req, res) => {
  try {
    const {
      candidateName,
      contactNumber,
      qualification,
      location,
      experience,
      response,
      responseCode,
      notes,
      callNumber,
      date,
    } = req.body;

    if (!response) {
      return res.status(400).json({ message: "Response is required" });
    }

    const data = await HrCallingData.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!data) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    data.candidateName = candidateName ?? data.candidateName;
    data.contactNumber = contactNumber ?? data.contactNumber;
    data.qualification = qualification ?? data.qualification;
    data.location = location ?? data.location;
    data.experience = experience ?? data.experience;
    data.notes = notes ?? data.notes;

    if (!data.response1) {
      data.response1 = response;
      data.response1Date = date || "";
    } else if (!data.response2) {
      data.response2 = response;
      data.response2Date = date || "";
    } else if (!data.response3) {
      data.response3 = response;
      data.response3Date = date || "";
    }

/*
 * After Response 1, 2 and 3 are filled,
 * every additional call is stored only
 * as the latest Last Response.
 */

    data.lastResponse = response;
    data.lastResponseCode = responseCode || "";
    data.lastResponseDate = date || "";
    data.lastCallNumber = Number(callNumber) || 0;

    await data.save();

    const existingPipelineCandidate =
  await HrCandidatePipeline.findOne({
    sourceCallingDataId: data._id,
  });

const pipelineCreationStatuses = [
  "INTERESTED",
  "CALL_BACK",
  "NOT_LIFTING",
  "NOT_CONNECTED",
];

const shouldCreatePipelineCandidate =
  pipelineCreationStatuses.includes(responseCode);

if (existingPipelineCandidate || shouldCreatePipelineCandidate) {
  const hasBeenInterested =
  responseCode === "INTERESTED" ||
  existingPipelineCandidate?.interestedCandidate === true ||
  existingPipelineCandidate?.lastResponseCode === "INTERESTED";

/*
 * Preserve the first date on which
 * this candidate became Interested.
 *
 * Once interestedAt is stored,
 * future responses must not change it.
 */
const interestedAt =
  existingPipelineCandidate?.interestedAt ||
  (
    responseCode === "INTERESTED"
      ? date
        ? new Date(
            `${date}T00:00:00.000Z`
          )
        : new Date()
      : null
  );

await HrCandidatePipeline.findOneAndUpdate(
    {
      sourceCallingDataId: data._id,
    },
    {
      $set: {
        sourceCallingDataId: data._id,

        uploadedBy:
          data.uploadedBy ||
          req.user?._id ||
          req.user?.id,

        candidateName: data.candidateName || "",
        contactNumber: data.contactNumber || "",
        jobPortal: data.jobPortal || "",
        qualification: data.qualification || "",
        location: data.location || "",
        experience: data.experience || "",
        notes: data.notes || "",

        lastResponse: data.lastResponse || "",
        lastResponseCode: data.lastResponseCode || "",
        lastResponseDate: data.lastResponseDate || "",
        lastCallNumber: data.lastCallNumber || 0,

        interestedCandidate: hasBeenInterested,
        interestedAt,
      },
    },
    {
      upsert: shouldCreatePipelineCandidate,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

    res.json({
      message: "HR calling response updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update HR call response error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete(
  "/candidate-pipeline/:id",
  protect,
  async (req, res) => {
    try {
      const candidate =
        await HrCandidatePipeline.findByIdAndDelete(
          req.params.id
        );

      if (!candidate) {
        return res.status(404).json({
          message: "Interested candidate not found",
        });
      }

      res.json({
        message:
          "Candidate removed from Interested Candidates successfully",
      });
    } catch (error) {
      console.error(
        "Delete interested candidate error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.delete("/:id", protect, async (req, res) => {
  try {
    const data = await HrCallingData.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    res.json({ message: "Calling data deleted successfully" });
  } catch (error) {
    console.error("Delete HR calling data error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;