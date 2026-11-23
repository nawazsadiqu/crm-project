import mongoose from "mongoose";
import EmployeeDetail from "../models/EmployeeDetail.js";
import User from "../models/User.js";

const syncUserActiveStatus = async ({ userId, status }) => {
  if (!userId) return;

  await User.findByIdAndUpdate(
    userId,
    {
      isActive: status !== "inactive"
    },
    {
      runValidators: true
    }
  );
};

export const getAllEmployeeDetails = async (req, res) => {
  try {
    const employees = await EmployeeDetail.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error) {
    console.error("getAllEmployeeDetails error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveEmployeeDetail = async (req, res) => {
  try {
    const {
      userId,
      name,
      number,
      employeeId,
      mailId,
      position,
      salary,
      dob,
      birthMonth,
      gender,
      qualification,
      role,
      telecallerCategory,
      father,
      mother,
      parentsNo,
      parentsNo2,
      address,
      dateOfJoin,
      status
    } = req.body;

    const finalName = String(name || "").trim();
    const finalEmployeeId = String(employeeId || "").trim();
    const finalEmail = String(mailId || "").trim();

    if (!finalName || !finalEmployeeId || !finalEmail || !role) {
      return res.status(400).json({
        message: "Name, Employee ID, Email and Role are required"
      });
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Please select a valid linked User Account"
      });
    }

    const linkedUser = await User.findById(userId);

    if (!linkedUser) {
      return res.status(404).json({
        message: "Linked User Account not found"
      });
    }

    // Prevent HR from assigning privileged login roles.
    if (
      role !== linkedUser.role &&
      ["admin", "hr"].some(
        (privilegedRole) =>
          privilegedRole === role ||
          privilegedRole === linkedUser.role
      )
    ) {
      return res.status(403).json({
        message: "Admin approval is required for privileged role changes"
      });
    }

    const duplicate = await EmployeeDetail.findOne({
      $or: [
        { employeeId: finalEmployeeId },
        { userId: linkedUser._id }
      ]
    });

    if (duplicate) {
      return res.status(409).json({
        message:
          "Employee ID or linked User Account is already assigned"
      });
    }

    const existingEmailUser = await User.findOne({
      email: finalEmail
    })
      .collation({ locale: "en", strength: 2 })
      .select("_id");

    if (
      existingEmailUser &&
      String(existingEmailUser._id) !==
      String(linkedUser._id)
    ) {
      return res.status(409).json({
        message: "This email belongs to another login account"
      });
    }

    const allowedCategories = [
      "GBP",
      "WEBSITE",
      "WHATSAPP_BROADCAST"
    ];

    const finalCategory =
      role === "telecaller"
        ? String(telecallerCategory || "").trim()
        : null;

    if (
      role === "telecaller" &&
      !allowedCategories.includes(finalCategory)
    ) {
      return res.status(400).json({
        message: "Please select a valid Telecaller category"
      });
    }

    const finalStatus =
      status === "inactive" ? "inactive" : "active";

    const employeeData = {
      userId: linkedUser._id,
      name: finalName,
      number,
      employeeId: finalEmployeeId,
      mailId: finalEmail,
      position,
      salary: Number(salary || 0),
      dob,
      birthMonth,
      gender,
      qualification,
      role,
      telecallerCategory: finalCategory,
      father,
      mother,
      parentsNo,
      parentsNo2,
      address,
      dateOfJoin,
      status: finalStatus
    };

    const session = await mongoose.startSession();
    let newEmployee;

    try {
      await session.withTransaction(async () => {
        const created = await EmployeeDetail.create(
          [employeeData],
          { session }
        );

        newEmployee = created[0];

        await User.findByIdAndUpdate(
          linkedUser._id,
          {
            $set: {
              name: finalName,
              email: finalEmail,
              role,
              telecallerCategory: finalCategory,
              isActive: finalStatus === "active"
            }
          },
          {
            session,
            runValidators: true
          }
        );
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      message: "Employee and linked User Account created successfully",
      data: newEmployee
    });
  } catch (error) {
    console.error("saveEmployeeDetail error:", error);

    const statusCode =
      error.code === 11000
        ? 409
        : error.name === "ValidationError" ||
          error.name === "CastError"
          ? 400
          : 500;

    return res.status(statusCode).json({
      message:
        error.code === 11000
          ? "Duplicate employee or account information"
          : error.message
    });
  }
};

export const updateEmployeeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      userId,
      name,
      number,
      employeeId,
      mailId,
      position,
      salary,
      dob,
      birthMonth,
      gender,
      qualification,
      role,
      telecallerCategory,
      father,
      mother,
      parentsNo,
      parentsNo2,
      address,
      dateOfJoin,
      status
    } = req.body;

    if (!name || !employeeId || !mailId || !role) {
      return res.status(400).json({
        message: "Name, ID, Mail-ID and Role are required"
      });
    }

    const existingEmployee =
      await EmployeeDetail.findById(id);

    if (!existingEmployee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const duplicate = await EmployeeDetail.findOne({
      employeeId,
      _id: { $ne: id }
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Employee ID already exists"
      });
    }

    // Identify the actual login account.
    // Preserve the original linked login account.
    const existingLinkedId =
      existingEmployee.userId
        ? String(existingEmployee.userId)
        : "";

    if (
      existingLinkedId &&
      userId &&
      String(userId) !== existingLinkedId
    ) {
      return res.status(400).json({
        message:
          "Changing the linked User Account is not allowed during normal editing"
      });
    }

    const linkedId = existingLinkedId || userId;

    if (!linkedId || !mongoose.isValidObjectId(linkedId)) {
      return res.status(400).json({
        message: "Please select a valid linked User Account"
      });
    }

    const linkedUser = await User.findById(linkedId);

    if (!linkedUser) {
      return res.status(400).json({
        message:
          "Select a valid linked User Account before updating employee details"
      });
    }

    const finalName = String(name || "").trim();
    const finalEmail = String(mailId || "").trim();
    const finalEmployeeId = String(employeeId || "").trim();

    if (!finalName || !finalEmail || !finalEmployeeId) {
      return res.status(400).json({
        message: "Name, Employee ID and Email are required"
      });
    }

    const emailOwner = await User.findOne({
      email: finalEmail
    })
      .collation({ locale: "en", strength: 2 })
      .select("_id");

    if (
      emailOwner &&
      String(emailOwner._id) !== String(linkedUser._id)
    ) {
      return res.status(409).json({
        message: "Email already belongs to another User Account"
      });
    }

    // Require Admin approval for privileged role changes.
    if (
      role !== linkedUser.role &&
      ["admin", "hr"].some(
        (privilegedRole) =>
          privilegedRole === role ||
          privilegedRole === linkedUser.role
      )
    ) {
      return res.status(403).json({
        message: "Admin approval is required for privileged role changes"
      });
    }

    // Prevent linking two employees to one login account.
    const anotherEmployee = await EmployeeDetail.findOne({
      userId: linkedUser._id,
      _id: { $ne: id }
    });

    if (anotherEmployee) {
      return res.status(400).json({
        message:
          "This login account is already linked to another employee"
      });
    }

    const validCategories = [
      "GBP",
      "WEBSITE",
      "WHATSAPP_BROADCAST"
    ];

    const selectedCategory =
      String(telecallerCategory || "").trim();

    const finalCategory =
      role === "telecaller"
        ? selectedCategory ||
        existingEmployee.telecallerCategory ||
        linkedUser.telecallerCategory ||
        null
        : null;

    if (
      role === "telecaller" &&
      !validCategories.includes(finalCategory)
    ) {
      return res.status(400).json({
        message:
          "Please select a valid Telecaller service category"
      });
    }

    const finalStatus =
      status === "inactive" ? "inactive" : "active";

    const employeeUpdate = {
      userId: linkedUser._id,
      name: finalName,
      number,
      employeeId: finalEmployeeId,
      mailId: finalEmail,
      position,
      salary: Number(salary || 0),
      dob,
      birthMonth,
      gender,
      qualification,
      role,
      telecallerCategory: finalCategory,
      father,
      mother,
      parentsNo,
      parentsNo2,
      address,
      dateOfJoin,
      status: finalStatus
    };

    /*
      Save both records in one transaction.
      CTS Conexa uses MongoDB Atlas.

      EmployeeDetail:
        Personal details and HR role

      User:
        Login role, Telecaller category,
        active/inactive status
    */

    const session = await EmployeeDetail.startSession();

    try {
      await session.withTransaction(async () => {

        await EmployeeDetail.findByIdAndUpdate(
          id,
          employeeUpdate,
          {
            runValidators: true,
            session
          }
        );

        await User.findByIdAndUpdate(
          linkedUser._id,
          {
            $set: {
              name: finalName,
              email: finalEmail,
              role,
              telecallerCategory: finalCategory,
              isActive: finalStatus === "active"
            }
          },
          {
            runValidators: true,
            session
          }
        );

      });
    } finally {
      await session.endSession();
    }

    const updatedEmployee =
      await EmployeeDetail.findById(id);

    return res.status(200).json({
      message:
        "Employee details and login role updated successfully",
      data: updatedEmployee
    });

  } catch (error) {
    console.error("updateEmployeeDetail error:", error);

    const statusCode =
      error.code === 11000
        ? 409
        : error.name === "ValidationError" ||
          error.name === "CastError"
          ? 400
          : 500;

    return res.status(statusCode).json({
      message:
        error.code === 11000
          ? "Duplicate employee or account information"
          : error.message
    });
  }
};


export const deleteEmployeeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEmployee = await EmployeeDetail.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await syncUserActiveStatus({
      userId: deletedEmployee.userId,
      mailId: deletedEmployee.mailId,
      status: "inactive"
    });

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("deleteEmployeeDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await EmployeeDetail.findOne({
      userId: req.user.id
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found"
      });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("getMyEmployeeProfile error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingBirthdays = async (req, res) => {
  try {
    const daysAhead = Number(req.query.days) || 5;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();

    const employees = await EmployeeDetail.find({
      dob: { $exists: true, $ne: "" },
      $or: [
        { status: "active" },
        { status: { $exists: false } }
      ]
    });

    const upcomingBirthdays = employees
      .map((emp) => {
        if (!emp.dob) return null;

        const parts = emp.dob.split("-");
        if (parts.length !== 3) return null;

        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        if (Number.isNaN(month) || Number.isNaN(day)) return null;

        let nextBirthday = new Date(currentYear, month, day);
        nextBirthday.setHours(0, 0, 0, 0);

        if (nextBirthday < today) {
          nextBirthday = new Date(currentYear + 1, month, day);
          nextBirthday.setHours(0, 0, 0, 0);
        }

        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          _id: emp._id,
          name: emp.name,
          employeeId: emp.employeeId,
          role: emp.role,
          dob: emp.dob,
          birthMonth: emp.birthMonth,
          daysLeft: diffDays
        };
      })
      .filter((emp) => emp && emp.daysLeft >= 0 && emp.daysLeft <= daysAhead)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json(upcomingBirthdays);
  } catch (error) {
    console.error("getUpcomingBirthdays error:", error);
    res.status(500).json({ message: error.message });
  }
};