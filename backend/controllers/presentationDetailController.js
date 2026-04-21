import PresentationDetail from "../models/PresentationDetail.js";

export const getPresentationDetailByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const query = {
      userId: req.user.id
    };

    if (date) {
      query.date = date;
    }

    const records = await PresentationDetail.find(query).sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error("getPresentationDetailByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const savePresentationDetail = async (req, res) => {
  try {
    const {
      date,
      presentationNumber,
      businessName,
      mapLink,
      contact,
      response,
      status,
      notes
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    if (!businessName?.trim()) {
      return res.status(400).json({ message: "Business name is required" });
    }

    const normalizedStatus = status || "";
    const isAppointment = normalizedStatus === "Appointment Fixed";

    const newRecord = await PresentationDetail.create({
      userId: req.user.id,
      date,
      presentationNumber:
        presentationNumber === undefined || presentationNumber === null || presentationNumber === ""
          ? null
          : Number(presentationNumber),
      businessName: businessName || "",
      mapLink: mapLink || "",
      contact: contact || "",
      response: response || "",
      status: normalizedStatus,
      notes: notes || "",
      isAppointment,
      isVisitedAppointment: false
    });

    res.status(201).json({
      message: "Presentation details saved successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("savePresentationDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePresentationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await PresentationDetail.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!deletedRecord) {
      return res.status(404).json({ message: "Presentation detail not found" });
    }

    res.status(200).json({
      message: "Presentation detail deleted successfully"
    });
  } catch (error) {
    console.error("deletePresentationDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAppointmentsByDate = async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      userId: req.user.id,
      status: "Appointment Fixed"
    };

    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const records = await PresentationDetail.find(query).sort({
      date: -1,
      createdAt: -1
    });

    res.status(200).json(records);
  } catch (error) {
    console.error("getAppointmentsByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCallbackAppointmentsByDate = async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      userId: req.user.id,
      status: { $in: ["CBC", "CBA"] }
    };

    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const records = await PresentationDetail.find(query).sort({
      date: -1,
      createdAt: -1
    });

    res.status(200).json(records);
  } catch (error) {
    console.error("getCallbackAppointmentsByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getRejectedAppointmentsByDate = async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      userId: req.user.id,
      status: "Rejected"
    };

    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const records = await PresentationDetail.find(query).sort({
      date: -1,
      createdAt: -1
    });

    res.status(200).json(records);
  } catch (error) {
    console.error("getRejectedAppointmentsByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateVisitedAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisitedAppointment } = req.body;

    const updatedRecord = await PresentationDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        status: "Appointment Fixed"
      },
      {
        isVisitedAppointment: !!isVisitedAppointment
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Appointment record not found" });
    }

    res.status(200).json({
      message: "Visited appointment status updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("updateVisitedAppointmentStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getVisitedAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const query = {
      userId: req.user.id,
      status: "Appointment Fixed",
      isVisitedAppointment: true
    };

    if (date) {
      query.date = date;
    }

    const records = await PresentationDetail.find(query).sort({
      createdAt: -1
    });

    res.status(200).json(records);
  } catch (error) {
    console.error("getVisitedAppointmentsByDate error:", error);
    res.status(500).json({ message: error.message });
  }
};