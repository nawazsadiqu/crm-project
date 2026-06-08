import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

import HrCallingData from "../models/HrCallingData.js";
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
    data.lastResponseDate = date || "";
    data.lastCallNumber = Number(callNumber) || 0;

    await data.save();

    res.json({
      message: "HR calling response updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update HR call response error:", error);
    res.status(500).json({ message: error.message });
  }
});

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