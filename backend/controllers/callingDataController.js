import mongoose from "mongoose";
import CallingData from "../models/CallingData.js";

export const bulkCreateCallingData = async (req, res) => {
  try {
    const { assignedTo, monthKey, weekNumber, data } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned BA is required" });
    }

    if (!monthKey) {
      return res.status(400).json({ message: "Month is required" });
    }

    if (!weekNumber) {
      return res.status(400).json({ message: "Week number is required" });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Calling data is required" });
    }

    const selectedWeek = Number(weekNumber);

    // Delete old data from same BA + same week slot
    // Example: new Week 1 upload deletes previous Week 1 data
    await CallingData.deleteMany({
      assignedTo,
      weekNumber: selectedWeek
    });

    const batchId = `${monthKey}-W${selectedWeek}-${assignedTo}`;

    const formattedData = data
      .filter((item) => item.businessName)
      .map((item, index) => ({
        assignedTo,
        monthKey,
        weekNumber: selectedWeek,
        batchId,
        serialNumber: index + 1,
        businessName: item.businessName,
        contactNumber: item.contactNumber || "",
        mapLink: item.mapLink || ""
      }));

    if (formattedData.length === 0) {
      return res.status(400).json({ message: "No valid data found" });
    }

    const createdData = await CallingData.insertMany(formattedData);

    res.status(201).json({
      message: `Week ${selectedWeek} calling data uploaded successfully`,
      count: createdData.length,
      batchId,
      data: createdData
    });
  } catch (error) {
    console.error("bulkCreateCallingData error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyCallingData = async (req, res) => {
  try {
    const { weekNumber } = req.query;

    const query = {
      assignedTo: req.user.id
    };

    if (weekNumber) {
      query.weekNumber = Number(weekNumber);
    }

    const data = await CallingData.find(query);

    const weekSummary = await CallingData.aggregate([
      {
        $match: {
          assignedTo: req.user._id
        }
      },
      {
        $group: {
          _id: "$weekNumber",
          uploadedAt: { $max: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    const hasResponse = (item) => {
      return Boolean(
        item.response1 ||
          item.response2 ||
          item.response3 ||
          item.lastResponse ||
          item.lastStatus
      );
    };

    data.sort((a, b) => {
      if (!!a.isIgnored !== !!b.isIgnored) {
        return a.isIgnored ? 1 : -1;
      }

      const aHasResponse = hasResponse(a);
      const bHasResponse = hasResponse(b);

      if (aHasResponse !== bHasResponse) {
        return aHasResponse ? 1 : -1;
      }

      if (aHasResponse && bHasResponse) {
        const aTime = a.responseUpdatedAt
          ? new Date(a.responseUpdatedAt).getTime()
          : 0;

        const bTime = b.responseUpdatedAt
          ? new Date(b.responseUpdatedAt).getTime()
          : 0;

        return aTime - bTime;
      }

      return (a.serialNumber || 0) - (b.serialNumber || 0);
    });

    res.status(200).json({
      records: data,
      weekSummary
    });
  } catch (error) {
    console.error("getMyCallingData error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAdminCallingData = async (req, res) => {
  try {
    const {
      assignedTo,
      weekNumber
    } = req.query;

    if (!assignedTo) {
      return res.status(400).json({
        message: "BA is required"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        assignedTo
      )
    ) {
      return res.status(400).json({
        message: "Invalid BA"
      });
    }

    const assignedToObjectId =
      new mongoose.Types.ObjectId(
        assignedTo
      );

    const query = {
      assignedTo: assignedToObjectId
    };

    if (weekNumber) {
      query.weekNumber =
        Number(weekNumber);
    }

    /*
      Return the same CallingData records
      that are shown on the BA page.
    */
    const records =
      await CallingData.find(query).sort({
        serialNumber: 1,
        createdAt: 1
      });

    const weekSummary =
      await CallingData.aggregate([
        {
          $match: {
            assignedTo:
              assignedToObjectId
          }
        },
        {
          $group: {
            _id: "$weekNumber",
            uploadedAt: {
              $max: "$createdAt"
            },
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            _id: 1
          }
        }
      ]);

    res.status(200).json({
      records,
      weekSummary
    });
  } catch (error) {
    console.error(
      "getAdminCallingData error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch BA calling data"
    });
  }
};

export const getAllCallingData = async (req, res) => {
  try {
    const data = await CallingData.find()
      .populate("assignedTo", "name email role")
      .sort({ serialNumber: 1, createdAt: 1 });

    res.status(200).json(data);
  } catch (error) {
    console.error("getAllCallingData error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCallingDataResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, callNumber, date } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const callingData = await CallingData.findById(id);

    if (!callingData) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    const responseText = [
      `Status: ${status}`,
      callNumber ? `Call Number: ${callNumber}` : "",
      notes ? `Notes: ${notes}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const responseDate = date || new Date().toISOString().split("T")[0];

    if (!callingData.response1) {
      callingData.response1 = responseText;
      callingData.response1Date = responseDate;
    } else if (!callingData.response2) {
      callingData.response2 = responseText;
      callingData.response2Date = responseDate;
    } else if (!callingData.response3) {
      callingData.response3 = responseText;
      callingData.response3Date = responseDate;
    } else {
      // 4th call and every call after that updates only latest last response
      callingData.lastResponse = responseText;
      callingData.lastResponseDate = responseDate;
      callingData.isCompleted = true;
    }

    callingData.lastStatus = status;

    const extractStatusCode = (
      response
    ) => {
      const responseText = String(
        response || ""
      );

      const match = responseText.match(
        /Status:\s*([^,\n|]+)/i
      );

      return match
        ? String(match[1])
            .trim()
            .toUpperCase()
        : "";
    };

    const responseStatuses = [
      callingData.response1,
      callingData.response2,
      callingData.response3,
      callingData.lastResponse
    ].map(extractStatusCode);

    const noAnswerAttemptCount =
      responseStatuses.filter(
        (responseStatus) =>
          responseStatus === "NC" ||
          responseStatus === "NA"
      ).length;

    const hasThreeNoAnswerAttempts =
      noAnswerAttemptCount >= 3;

    const hasFourResponses = Boolean(
      String(
        callingData.response1 || ""
      ).trim() &&
      String(
        callingData.response2 || ""
      ).trim() &&
      String(
        callingData.response3 || ""
      ).trim() &&
      String(
        callingData.lastResponse || ""
      ).trim()
    );

    const finalStatuses = [
      "AP",
      "NI",
      "CTS_CLIENT"
    ];

    callingData.isCompleted =
      finalStatuses.includes(status) ||
      hasFourResponses ||
      hasThreeNoAnswerAttempts ||
      Boolean(callingData.isIgnored);

    callingData.responseUpdatedAt =
      new Date();

    const updatedData = await callingData.save();

    res.status(200).json({
      message: "Response updated successfully",
      data: updatedData
    });
  } catch (error) {
    console.error("updateCallingDataResponse error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCallingDataContactNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactNumber } = req.body;

    const updatedData = await CallingData.findByIdAndUpdate(
      id,
      { contactNumber: contactNumber || "" },
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    res.status(200).json({
      message: "Contact number updated successfully",
      data: updatedData
    });
  } catch (error) {
    console.error("updateCallingDataContactNumber error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteCallingData = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedData = await CallingData.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    res.status(200).json({ message: "Calling data deleted successfully" });
  } catch (error) {
    console.error("deleteCallingData error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCallingDataIgnoredStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isIgnored } = req.body;

    const updatedData = await CallingData.findByIdAndUpdate(
      id,
      { isIgnored: Boolean(isIgnored) },
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Calling data not found" });
    }

    res.status(200).json({
      message: "Calling data status updated successfully",
      data: updatedData
    });
  } catch (error) {
    console.error("updateCallingDataIgnoredStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};