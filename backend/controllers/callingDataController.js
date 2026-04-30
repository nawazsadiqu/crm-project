import CallingData from "../models/CallingData.js";

export const bulkCreateCallingData = async (req, res) => {
  try {
    const { assignedTo, data } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned BA is required" });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Calling data is required" });
    }

    const existingCount = await CallingData.countDocuments({ assignedTo });

    const formattedData = data
      .filter((item) => item.businessName)
      .map((item, index) => ({
        assignedTo,
        serialNumber: existingCount + index + 1,
        businessName: item.businessName,
        contactNumber: item.contactNumber || "",
        mapLink: item.mapLink || ""
      }));

    if (formattedData.length === 0) {
      return res.status(400).json({ message: "No valid data found" });
    }

    const createdData = await CallingData.insertMany(formattedData);

    res.status(201).json({
      message: "Calling data uploaded successfully",
      count: createdData.length,
      data: createdData
    });
  } catch (error) {
    console.error("bulkCreateCallingData error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyCallingData = async (req, res) => {
  try {
    const data = await CallingData.find({
  assignedTo: req.user.id
});

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

  if (hasResponse(a) !== hasResponse(b)) {
    return hasResponse(a) ? 1 : -1;
  }

  return (a.serialNumber || 0) - (b.serialNumber || 0);
});

res.status(200).json(data);
  } catch (error) {
    console.error("getMyCallingData error:", error);
    res.status(500).json({ message: error.message });
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