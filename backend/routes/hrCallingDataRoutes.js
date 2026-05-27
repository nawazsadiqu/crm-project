import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

import HrCallingData from "../models/HrCallingData.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const results = [];

    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          serialNumber: row.serialNumber || row["Serial Number"] || row["S No"],
          candidateName: row.candidateName || row["Candidate Name"] || row["Name"],
          contactNumber: row.contactNumber || row["Contact Number"] || row["Phone"],
          qualification: row.qualification || row["Qualification"],
          location: row.location || row["Location"],
          experience: row.experience || row["Experience"],
          notes: row.notes || row["Notes"],
          uploadedBy: req.user?._id,
        });
      })
      .on("end", async () => {
        await HrCallingData.insertMany(results);

        fs.unlinkSync(req.file.path);

        res.status(201).json({
          message: "HR calling data uploaded successfully",
          count: results.length,
        });
      });
  } catch (error) {
    console.error("HR calling data upload error:", error);
    res.status(500).json({ message: "Failed to upload HR calling data" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const data = await HrCallingData.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (error) {
    console.error("Fetch HR calling data error:", error);
    res.status(500).json({ message: "Failed to fetch HR calling data" });
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
    res.status(500).json({ message: "Failed to delete calling data" });
  }
});

export default router;