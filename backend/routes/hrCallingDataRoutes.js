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
        results.push({
          uploadBatch,
          serialNumber:
            Number(
              row.serialNumber ||
                row["Serial Number"] ||
                row["S No"] ||
                row["Sl No"]
            ) || results.length + 1,

          candidateName: clean(
            row.candidateName || row["Candidate Name"] || row["Name"]
          ),

          contactNumber: clean(
            row.contactNumber ||
              row["Contact Number"] ||
              row["Contact"] ||
              row["Contact No"] ||
              row["Mobile"] ||
              row["Mobile Number"] ||
              row["Phone"] ||
              row["Phone Number"] ||
              row["Number"]
          ),

          jobPortal: clean(
            row.jobPortal ||
              row["Job Portal"] ||
              row["Job portal"] ||
              row["JobPortal"] ||
              row["Job Source"] ||
              row["Platform"] ||
              row["Portal"] ||
              row["Source"]
          ),

          qualification: clean(row.qualification || row["Qualification"]),
          location: clean(row.location || row["Location"]),
          experience: clean(row.experience || row["Experience"]),
          notes: clean(row.notes || row["Notes"]),
          uploadedBy: req.user?._id || req.user?.id,
        });
      })
      .on("end", async () => {
        await HrCallingData.updateMany(
          {
            uploadBatch,
            isDeleted: false,
          },
          {
            isDeleted: true,
          }
        );

        await HrCallingData.insertMany(results);

        fs.unlinkSync(req.file.path);

        res.status(201).json({
          message: `Data ${uploadBatch} replaced successfully`,
          count: results.length,
          uploadBatch,
        });
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
    const pipelineCandidates = await HrCandidatePipeline.find({
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
})
  .sort({ updatedAt: -1 })
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
    const data = await HrCandidatePipeline.find({
      interview: true,
      interviewDate: { $ne: "" },
    }).sort({ interviewDate: 1, updatedAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("Fetch scheduled interviews error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/resume-got-candidates", protect, async (req, res) => {
  try {
    const data = await HrCandidatePipeline.find({
      resumeGot: "Yes",
    }).sort({ updatedAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("Fetch resume got candidates error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/joined-candidates", protect, async (req, res) => {
  try {
    const data = await HrCandidatePipeline.find({
      joined: true,
    }).sort({ updatedAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("Fetch joined candidates error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/interview-details", protect, async (req, res) => {
  try {
    const { resumeGot, interview, interviewDate, joined } = req.body;

    const data = await HrCandidatePipeline.findByIdAndUpdate(
      req.params.id,
      {
        resumeGot: resumeGot || "",
        interview: Boolean(interview),
        interviewDate: Boolean(interview) ? interviewDate || "" : "",
        joined: Boolean(joined),
      },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json({
      message: "Interview details updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update interview details error:", error);
    res.status(500).json({ message: error.message });
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
    } else if (!data.response4) {
      data.response4 = response;
      data.response4Date = date || "";
    } else {
      data.response5 = response;
      data.response5Date = date || "";
    }

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