import PresentationDetail from "../models/PresentationDetail.js";
import FormDetail from "../models/FormDetail.js";
import User from "../models/User.js";
import EmployeeDetail from "../models/EmployeeDetail.js";

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

    const currentUser = await User.findById(
      req.user.id
    ).select(
      "_id role telecallerCategory"
    );

    if (!currentUser) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const isTelecaller =
      currentUser.role === "telecaller";

    const isBa =
      currentUser.role === "ba";

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
      fixedByRole:
        isTelecaller
          ? "telecaller"
          : isBa
            ? "ba"
            : "",

      telecallerId:
        isTelecaller
          ? currentUser._id
          : null,

      telecallerCategory:
        isTelecaller
          ? currentUser.telecallerCategory || null
          : null,

      assignedBaId: null,

      assignedByAdminId: null,

      assignedAt: null,

      assignmentStatus:
        isTelecaller && isAppointment
          ? "UNASSIGNED"
          : "",

      tcAppointmentStatus:
        isTelecaller && isAppointment
          ? "PENDING_ASSIGNMENT"
          : "",
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
    const {
      month,
      date,
      all
    } = req.query;

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

    /*
      DAILY VIEW

      Filter according to the date
      on which appointment was fixed.
    */
    if (!all && date) {
      query.date = date;
    }

    /*
      MONTHLY / WEEKLY VIEW

      Fetch appointments according to
      the month in which they were fixed.
    */
    else if (!all && month) {
      query.date = {
        $regex: `^${month}`
      };
    }

    const records =
      await PresentationDetail.find(
        query
      ).sort({
        date: -1,
        appointmentDate: 1,
        appointmentTime: 1,
        createdAt: -1
      });

    res.status(200).json(
      records
    );
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
        fixedByRole: { $ne: "telecaller" },
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

    /*
      Get all appointment IDs currently
      displayed on this page.
    */
    const presentationIds = records.map(
      (item) => item._id
    );

    /*
      Find forms already connected to
      these visited appointments.

      Only root forms count as a closed deal.
    */
    const linkedForms =
      await FormDetail.find({
        sourcePresentationId: {
          $in: presentationIds
        },

        $or: [
          {
            parentFormId: null
          },
          {
            parentFormId: {
              $exists: false
            }
          }
        ]
      })
        .select(
          "_id sourcePresentationId businessName date"
        )
        .lean();

    /*
      Create a quick lookup:
      Presentation ID -> Form
    */
    const linkedFormMap = new Map();

    linkedForms.forEach((form) => {
      if (form.sourcePresentationId) {
        linkedFormMap.set(
          String(form.sourcePresentationId),
          form
        );
      }
    });

    /*
      Add closed-deal information to every
      visited appointment.
    */
    const recordsWithDealStatus =
      records.map((record) => {
        const recordObject =
          record.toObject();

        const linkedForm =
          linkedFormMap.get(
            String(record._id)
          );

        return {
          ...recordObject,

          hasClosedDeal:
            Boolean(linkedForm),

          closedDealId:
            linkedForm?._id || null,

          closedDealDate:
            linkedForm?.date || ""
        };
      });

    res.status(200).json(
      recordsWithDealStatus
    );
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
        fixedByRole: { $ne: "telecaller" },
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
            fixedByRole: { $ne: "telecaller" },
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

export const getTelecallerAppointmentsForAdmin =
  async (req, res) => {
    try {
      const records =
        await PresentationDetail.find({
          fixedByRole: "telecaller",
          status: "Appointment Fixed",
          isAppointment: true
        })
          .populate(
            "telecallerId",
            "name email role telecallerCategory"
          )
          .populate(
            "assignedBaId",
            "name email role"
          )
          .populate(
            "assignedByAdminId",
            "name email role"
          )
          .sort({
            appointmentDate: 1,
            appointmentTime: 1,
            createdAt: -1
          });

      res.status(200).json(records);
    } catch (error) {
      console.error(
        "getTelecallerAppointmentsForAdmin error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to fetch Telecaller appointments"
      });
    }
  };


export const assignTelecallerAppointmentToBa =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        assignedBaId
      } = req.body;

      if (!assignedBaId) {
        return res.status(400).json({
          message:
            "BA selection is required"
        });
      }

      /*
        ROLE must come from User.role.
        Position is completely ignored.
      */
      const baUser =
        await User.findOne({
          _id: assignedBaId,
          role: "ba"
        }).select(
          "_id name email role"
        );

      if (!baUser) {
        return res.status(400).json({
          message:
            "Selected user is not a BA"
        });
      }

      /*
        Employee status decides whether
        this BA is currently active.
      */
      const activeBaEmployee =
        await EmployeeDetail.findOne({
          userId: baUser._id,

          $or: [
            {
              status: "active"
            },
            {
              status: "Active"
            },
            {
              status: ""
            },
            {
              status: {
                $exists: false
              }
            }
          ]
        });

      if (!activeBaEmployee) {
        return res.status(400).json({
          message:
            "Selected BA is inactive"
        });
      }

      const updatedRecord =
        await PresentationDetail.findOneAndUpdate(
          {
            _id: id,
            fixedByRole:
              "telecaller",
            status:
              "Appointment Fixed",
            isAppointment: true,
            tcAppointmentStatus: {
              $in: [
                "",
                "PENDING_ASSIGNMENT",
                "ASSIGNED",
                "NOT_VISITED"
              ]
            }
          },
          {
            assignedBaId:
              baUser._id,

            assignedByAdminId:
              req.user.id,

            assignedAt:
              new Date(),

            assignmentStatus:
              "ASSIGNED",

            tcAppointmentStatus:
              "ASSIGNED",

            presentationUpdatedAt:
              new Date()
          },
          {
            new: true
          }
        )
          .populate(
            "telecallerId",
            "name email role telecallerCategory"
          )
          .populate(
            "assignedBaId",
            "name email role"
          );

      if (!updatedRecord) {
        return res.status(404).json({
          message:
            "Telecaller appointment not found"
        });
      }

      res.status(200).json({
        message:
          "BA assigned successfully",
        data:
          updatedRecord
      });
    } catch (error) {
      console.error(
        "assignTelecallerAppointmentToBa error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to assign BA"
      });
    }
  };

export const getAssignedTelecallerAppointmentsForBa =
  async (req, res) => {
    try {
      const records =
        await PresentationDetail.find({
          fixedByRole: "telecaller",

          assignedBaId:
            req.user.id,

          assignmentStatus:
            "ASSIGNED",

          status:
            "Appointment Fixed",

          isAppointment: true
        })
          .populate(
            "telecallerId",
            "name email telecallerCategory"
          )
          .populate(
            "assignedBaId",
            "name email"
          )
          .sort({
            appointmentDate: 1,
            appointmentTime: 1,
            createdAt: -1
          });

      res.status(200).json(
        records
      );
    } catch (error) {
      console.error(
        "getAssignedTelecallerAppointmentsForBa error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to fetch assigned Telecaller appointments"
      });
    }
  };


export const updateTelecallerAppointmentVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisitedAppointment, visitedDate } = req.body;

    if (typeof isVisitedAppointment !== "boolean") {
      return res.status(400).json({
        message: "isVisitedAppointment must be true or false"
      });
    }

    if (
      isVisitedAppointment &&
      (
        typeof visitedDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(visitedDate) ||
        Number.isNaN(Date.parse(`${visitedDate}T00:00:00Z`))
      )
    ) {
      return res.status(400).json({
        message: "A valid visited date (YYYY-MM-DD) is required"
      });
    }

    const updatedRecord =
      await PresentationDetail.findOneAndUpdate(
        {
          _id: id,
          fixedByRole: "telecaller",
          assignedBaId: req.user.id,
          assignmentStatus: "ASSIGNED",
          status: "Appointment Fixed",
          isAppointment: true,

          // Never overwrite a finalized deal.
          tcAppointmentStatus: {
            $in: [
              "ASSIGNED",
              "NOT_VISITED",
              "VISITED"
            ]
          }
        },
        {
          $set: {
            isVisitedAppointment,
            visitedDate: isVisitedAppointment
              ? visitedDate
              : "",
            visitedByBaId: isVisitedAppointment
              ? req.user.id
              : null,
            visitedAt: isVisitedAppointment
              ? new Date()
              : null,
            tcAppointmentStatus: isVisitedAppointment
              ? "VISITED"
              : "NOT_VISITED",
            presentationUpdatedAt: new Date()
          }
        },
        { new: true }
      )
        .populate(
          "telecallerId",
          "name email telecallerCategory"
        )
        .populate(
          "assignedBaId",
          "name email"
        );

    if (!updatedRecord) {
      return res.status(409).json({
        message:
          "Appointment not found, not assigned to you, or already finalized. Refresh the page."
      });
    }

    res.status(200).json({
      message: isVisitedAppointment
        ? "Appointment marked as Visited"
        : "Appointment marked as Not Visited",
      data: updatedRecord
    });
  } catch (error) {
    console.error(
      "updateTelecallerAppointmentVisitStatus error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to update appointment visit status"
    });
  }
};


export const updateTelecallerAppointmentVisitedResponse =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { visitedResponse } = req.body;

      if (
        typeof visitedResponse !== "string" ||
        visitedResponse.length > 1500
      ) {
        return res.status(400).json({
          message:
            "Visit notes must be text of at most 1500 characters"
        });
      }

      const updatedRecord =
        await PresentationDetail.findOneAndUpdate(
          {
            _id: id,
            fixedByRole: "telecaller",
            assignedBaId: req.user.id,
            assignmentStatus: "ASSIGNED",

            tcAppointmentStatus: {
              $in: [
                "ASSIGNED",
                "NOT_VISITED",
                "VISITED",
                "DEAL_CLOSED",
                "NOT_INTERESTED",
                "FORM_COMPLETED"
              ]
            }
          },
          {
            $set: {
              visitedResponse: visitedResponse.trim(),
              presentationUpdatedAt: new Date()
            }
          },
          { new: true }
        );

      if (!updatedRecord) {
        return res.status(409).json({
          message:
            "Appointment not found or you are not its assigned BA"
        });
      }

      res.status(200).json({
        message: "BA visit notes saved successfully",
        data: updatedRecord
      });
    } catch (error) {
      console.error(
        "updateTelecallerAppointmentVisitedResponse error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to save BA visit notes"
      });
    }
  };


export const reopenTelecallerAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment =
      await PresentationDetail.findOne({
        _id: id,
        fixedByRole: "telecaller",
        assignedBaId: req.user.id,
        assignmentStatus: "ASSIGNED",
        isVisitedAppointment: true,

        tcAppointmentStatus: {
          $in: [
            "DEAL_CLOSED",
            "NOT_INTERESTED"
          ]
        }
      });

    if (!appointment) {
      return res.status(409).json({
        message:
          "Appointment not found, not assigned to you, or cannot be edited"
      });
    }

    // Do not undo a closed deal after a form exists.
    const linkedForm = await FormDetail.exists({
      sourcePresentationId: appointment._id,

      $or: [
        { parentFormId: null },
        {
          parentFormId: {
            $exists: false
          }
        }
      ]
    });

    if (linkedForm) {
      return res.status(409).json({
        message:
          "A business form already exists. Contact Admin to correct a completed deal."
      });
    }

    const updatedRecord =
      await PresentationDetail.findOneAndUpdate(
        {
          _id: id,
          fixedByRole: "telecaller",
          assignedBaId: req.user.id,

          tcAppointmentStatus: {
            $in: [
              "DEAL_CLOSED",
              "NOT_INTERESTED"
            ]
          }
        },
        {
          $set: {
            tcAppointmentStatus: "VISITED",

            dealClosedByBaId: null,
            dealClosedAt: null,

            isVisitedNotInterested: false,
            visitedRejectionReason: "",
            visitedRejectedAt: null,

            presentationUpdatedAt: new Date()
          }
        },
        { new: true }
      )
        .populate(
          "telecallerId",
          "name email telecallerCategory"
        )
        .populate(
          "assignedBaId",
          "name email"
        );

    if (!updatedRecord) {
      return res.status(409).json({
        message:
          "Appointment changed while you were editing. Refresh and retry."
      });
    }

    res.status(200).json({
      message: "Appointment reopened for correction",
      data: updatedRecord
    });
  } catch (error) {
    console.error(
      "reopenTelecallerAppointment error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to reopen appointment"
    });
  }
};



export const markTelecallerAppointmentDealClosed =
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedRecord =
        await PresentationDetail.findOneAndUpdate(
          {
            _id: id,

            fixedByRole:
              "telecaller",

            assignedBaId:
              req.user.id,

            assignmentStatus:
              "ASSIGNED",

            status:
              "Appointment Fixed",

            isVisitedAppointment:
              true,

            tcAppointmentStatus:
              "VISITED"
          },
          {
            dealClosedByBaId:
              req.user.id,

            dealClosedAt:
              new Date(),

            tcAppointmentStatus:
              "DEAL_CLOSED",

            presentationUpdatedAt:
              new Date()
          },
          {
            new: true
          }
        )
          .populate(
            "telecallerId",
            "name email telecallerCategory"
          )
          .populate(
            "assignedBaId",
            "name email"
          );

      if (!updatedRecord) {
        return res
          .status(404)
          .json({
            message:
              "Visited Telecaller appointment not found or not assigned to you"
          });
      }

      res.status(200).json({
        message:
          "Deal closed successfully",

        data:
          updatedRecord
      });
    } catch (error) {
      console.error(
        "markTelecallerAppointmentDealClosed error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to close deal"
      });
    }
  };

export const markTelecallerAppointmentNotInterested =
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedRecord =
        await PresentationDetail.findOneAndUpdate(
          {
            _id: id,

            fixedByRole:
              "telecaller",

            assignedBaId:
              req.user.id,

            assignmentStatus:
              "ASSIGNED",

            status:
              "Appointment Fixed",

            isVisitedAppointment:
              true,

            tcAppointmentStatus:
              "VISITED"
          },
          {
            isVisitedNotInterested:
              true,

            visitedRejectionReason:
              "Not Interested",

            visitedRejectedAt:
              new Date(),

            tcAppointmentStatus:
              "NOT_INTERESTED",

            presentationUpdatedAt:
              new Date()
          },
          {
            new: true
          }
        )
          .populate(
            "telecallerId",
            "name email telecallerCategory"
          )
          .populate(
            "assignedBaId",
            "name email"
          );

      if (!updatedRecord) {
        return res
          .status(404)
          .json({
            message:
              "Visited Telecaller appointment not found or not assigned to you"
          });
      }

      res.status(200).json({
        message:
          "Appointment marked as Not Interested",

        data:
          updatedRecord
      });
    } catch (error) {
      console.error(
        "markTelecallerAppointmentNotInterested error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to mark appointment as Not Interested"
      });
    }
  };

export const getTelecallerClosedDealsPendingForm =
  async (req, res) => {
    try {
      const records =
        await PresentationDetail.find({
          fixedByRole:
            "telecaller",

          telecallerId:
            req.user.id,

          tcAppointmentStatus:
            "DEAL_CLOSED",

          dealClosedByBaId: {
            $ne: null
          }
        })
          .populate(
            "assignedBaId",
            "name email"
          )
          .populate(
            "dealClosedByBaId",
            "name email"
          )
          .sort({
            dealClosedAt: -1,
            createdAt: -1
          });

      res.status(200).json(
        records
      );
    } catch (error) {
      console.error(
        "getTelecallerClosedDealsPendingForm error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to fetch closed deals"
      });
    }
  };