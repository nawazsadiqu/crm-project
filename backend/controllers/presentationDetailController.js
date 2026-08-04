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
  appointmentDate,
  appointmentTime,
  callbackDate,
  callbackTime,
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

    if (
  normalizedStatus ===
  "Appointment Fixed"
) {
  if (!appointmentDate) {
    return res.status(400).json({
      message:
        "Appointment date is required"
    });
  }

  if (!appointmentTime) {
    return res.status(400).json({
      message:
        "Appointment time is required"
    });
  }
}

if (
  normalizedStatus === "CBA" ||
  normalizedStatus === "CBC"
) {
  /*
    Date is mandatory for both
    callback statuses.
  */
  if (!callbackDate) {
    return res.status(400).json({
      message:
        "Callback date is required"
    });
  }

  /*
    Time is mandatory only for CBA.

    CBC can be saved without time.
  */
  if (
    normalizedStatus === "CBA" &&
    !callbackTime
  ) {
    return res.status(400).json({
      message:
        "Callback time is required"
    });
  }
}

    const newRecord = await PresentationDetail.create({
      userId: req.user.id,
      date,
      presentationNumber:
        presentationNumber === undefined ||
        presentationNumber === null ||
        presentationNumber === ""
          ? null
          : Number(presentationNumber),
      businessName: businessName || "",
      mapLink: mapLink || "",
      contact: contact || "",
      response: response || "",
      status: normalizedStatus,

      appointmentDate:
  normalizedStatus ===
  "Appointment Fixed"
    ? appointmentDate || ""
    : "",

appointmentTime:
  normalizedStatus ===
  "Appointment Fixed"
    ? appointmentTime || ""
    : "",

callbackDate:
  normalizedStatus === "CBA" ||
  normalizedStatus === "CBC"
    ? callbackDate || ""
    : "",

callbackTime:
  normalizedStatus === "CBA" ||
  normalizedStatus === "CBC"
    ? callbackTime || ""
    : "",

      notes: notes || "",
      isAppointment,
      isVisitedAppointment: false,
      visitedDate: "",
      presentationUpdatedAt: new Date()
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
    const { month, all } = req.query;

    const query = {
      userId: req.user.id,

      $or: [
        {
          status: "Appointment Fixed"
        },
        {
          status: "Rejected",
          rejectedFromAppointment: true
        }
      ]
    };

    if (!all && month) {
      query.appointmentDate = {
        $regex: `^${month}`
      };
    }

   const records =
  await PresentationDetail.find(
    query
  ).sort({
    appointmentDate: 1,
    appointmentTime: 1,
    createdAt: -1
  });

    res.status(200).json(records);
  } catch (error) {
    console.error(
      "getAppointmentsByDate error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

export const getCallbackAppointmentsByDate = async (
  req,
  res
) => {
  try {
    const {
      view = "monthly",
      month,
      startDate,
      endDate
    } = req.query;

    const query = {
      userId: req.user.id,
      status: {
        $in: ["CBC", "CBA"]
      }
    };

    /*
      Monthly view
      Example: month=2026-07
    */
    if (view === "monthly") {
      if (!month) {
        return res.status(400).json({
          message:
            "Month is required for monthly view"
        });
      }

      query.date = {
        $regex: `^${month}`
      };
    }

    /*
      Weekly view
      Example:
      startDate=2026-07-27
      endDate=2026-08-02
    */
    if (view === "weekly") {
      if (!startDate || !endDate) {
        return res.status(400).json({
          message:
            "Start date and end date are required for weekly view"
        });
      }

      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    /*
      All-time view:
      No date filter is added.
    */
    if (
      !["monthly", "weekly", "all"].includes(
        view
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid view. Use monthly, weekly, or all."
      });
    }

    const records =
      await PresentationDetail.find(query).sort({
        date: -1,
        createdAt: -1
      });

    res.status(200).json(records);
  } catch (error) {
    console.error(
      "getCallbackAppointmentsByDate error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch callback appointments"
    });
  }
};

export const getRejectedAppointmentsByDate = async (
  req,
  res
) => {
  try {
    const { month } = req.query;

    const query = {
      userId: req.user.id,

      $or: [
        {
          status: "Rejected"
        },
        {
          isVisitedNotInterested: true
        },
        {
          isCallbackNotInterested: true
        }
      ]
    };

    if (month) {
      query.$and = [
        {
          $or: [
            {
              date: {
                $regex: `^${month}`
              }
            },
            {
              appointmentDate: {
                $regex: `^${month}`
              }
            },
            {
              visitedDate: {
                $regex: `^${month}`
              }
            },
            {
              callbackDate: {
                $regex: `^${month}`
              }
            }
          ]
        }
      ];
    }

    const records =
      await PresentationDetail.find(query).sort({
        callbackRejectedAt: -1,
        visitedRejectedAt: -1,
        appointmentRejectedAt: -1,
        createdAt: -1
      });

    res.status(200).json(records);
  } catch (error) {
    console.error(
      "getRejectedAppointmentsByDate error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch rejected appointments"
    });
  }
};

export const updateVisitedAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisitedAppointment, visitedDate } = req.body;

    const updatedRecord = await PresentationDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        status: "Appointment Fixed"
      },
      {
        isVisitedAppointment: !!isVisitedAppointment,
        visitedDate: isVisitedAppointment ? visitedDate || "" : "",
        presentationUpdatedAt: new Date()
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

export const getVisitedAppointmentsByDate = async (
  req,
  res
) => {
  try {
    const { month } = req.query;

    const query = {
      userId: req.user.id,
      isVisitedAppointment: true
    };

    if (month) {
      query.visitedDate = {
        $regex: `^${month}`
      };
    }

    const records =
      await PresentationDetail.find(query).sort({
        visitedDate: -1,
        createdAt: -1
      });

    res.status(200).json(records);
  } catch (error) {
    console.error(
      "getVisitedAppointmentsByDate error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch visited appointments"
    });
  }
};

export const updateAppointmentNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updatedRecord = await PresentationDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        status: "Appointment Fixed"
      },
      {
        notes: notes || "",
        presentationUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: "Notes updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("updateAppointmentNotes error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentDate = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      appointmentDate,
      appointmentTime
    } = req.body;

    const updateFields = {
      appointmentDate:
        appointmentDate || "",
      presentationUpdatedAt:
        new Date()
    };

    if (
      appointmentTime !== undefined
    ) {
      updateFields.appointmentTime =
        appointmentTime || "";
    }

    const updatedRecord =
      await PresentationDetail.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id,
          status:
            "Appointment Fixed"
        },
        updateFields,
        {
          new: true
        }
      );

    if (!updatedRecord) {
      return res.status(404).json({
        message:
          "Appointment not found"
      });
    }

    res.status(200).json({
      message:
        "Appointment schedule updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error(
      "updateAppointmentDate error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

export const updateCallbackAppointmentNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updatedRecord = await PresentationDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        status: { $in: ["CBC", "CBA"] }
      },
      {
        notes: notes || "",
        presentationUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res
        .status(404)
        .json({ message: "Callback appointment not found" });
    }

    res.status(200).json({
      message: "Callback notes updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("updateCallbackAppointmentNotes error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCallbackAppointmentDate = async (req, res) => {
    try {
      const { id } = req.params;

      const {
        callbackDate,
        callbackTime
      } = req.body;

      const updateFields = {
        callbackDate:
          callbackDate || "",
        presentationUpdatedAt:
          new Date()
      };

      if (
        callbackTime !== undefined
      ) {
        updateFields.callbackTime =
          callbackTime || "";
      }

      const updatedRecord =
        await PresentationDetail.findOneAndUpdate(
          {
            _id: id,
            userId: req.user.id,
            status: {
              $in: ["CBC", "CBA"]
            }
          },
          updateFields,
          {
            new: true
          }
        );

      if (!updatedRecord) {
        return res.status(404).json({
          message:
            "Callback appointment not found"
        });
      }

      res.status(200).json({
        message:
          "Callback schedule updated successfully",
        data: updatedRecord
      });
    } catch (error) {
      console.error(
        "updateCallbackAppointmentDate error:",
        error
      );

      res.status(500).json({
        message: error.message
      });
    }
  };

export const updateVisitedResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitedResponse } = req.body;

    const updatedRecord = await PresentationDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        isVisitedAppointment: true
      },
      {
        visitedResponse: visitedResponse || "",
        presentationUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        message: "Visited appointment not found"
      });
    }

    res.status(200).json({
      message: "Visited response updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("updateVisitedResponse error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markVisitedAppointmentNotInterested =
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedRecord =
        await PresentationDetail.findOneAndUpdate(
          {
            _id: id,
            userId: req.user.id,
            isVisitedAppointment: true
          },
          {
            isVisitedNotInterested: true,
            visitedRejectionReason:
              "Not Interested",
            visitedRejectedAt: new Date(),
            presentationUpdatedAt:
              new Date()
          },
          {
            new: true
          }
        );

      if (!updatedRecord) {
        return res.status(404).json({
          message:
            "Visited appointment not found"
        });
      }

      res.status(200).json({
        message:
          "Visited appointment marked as Not Interested",
        data: updatedRecord
      });
    } catch (error) {
      console.error(
        "markVisitedAppointmentNotInterested error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to mark visited appointment as Not Interested"
      });
    }
  };

export const updateAppointmentResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const updatedRecord = await PresentationDetail.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        status: "Appointment Fixed"
      },
      {
        response: response || "",
        presentationUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    res.status(200).json({
      message: "Response updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("updateAppointmentResponse error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markAppointmentNotInterested = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const updatedRecord =
      await PresentationDetail.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id,
          status: "Appointment Fixed"
        },
        {
          status: "Rejected",
          isAppointment: false,
          rejectedFromAppointment: true,
          rejectionReason: "Not Interested",
          appointmentRejectedAt: new Date(),
          presentationUpdatedAt: new Date()
        },
        {
          new: true
        }
      );

    if (!updatedRecord) {
      return res.status(404).json({
        message:
          "Appointment not found or already updated"
      });
    }

    res.status(200).json({
      message:
        "Appointment marked as Not Interested",
      data: updatedRecord
    });
  } catch (error) {
    console.error(
      "markAppointmentNotInterested error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to mark appointment as Not Interested"
    });
  }
};

export const markCallbackAppointmentNotInterested = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const updatedRecord =
      await PresentationDetail.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id,
          status: {
            $in: ["CBC", "CBA"]
          }
        },
        {
          isCallbackNotInterested: true,
          callbackRejectionReason: "Not Interested",
          callbackRejectedAt: new Date(),
          presentationUpdatedAt: new Date()
        },
        {
          new: true
        }
      );

    if (!updatedRecord) {
      return res.status(404).json({
        message:
          "Callback appointment not found"
      });
    }

    res.status(200).json({
      message:
        "Callback appointment marked as Not Interested",
      data: updatedRecord
    });
  } catch (error) {
    console.error(
      "markCallbackAppointmentNotInterested error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to mark callback appointment as Not Interested"
    });
  }
};