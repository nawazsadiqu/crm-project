import EmployeeDetail from "../models/EmployeeDetail.js";

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
      father,
      mother,
      parentsNo,
      address,
      dateOfJoin
    } = req.body;

    if (!name || !employeeId || !mailId || !role) {
      return res.status(400).json({
        message: "Name, ID, Mail-ID and Role are required"
      });
    }

    const existingEmployee = await EmployeeDetail.findOne({ employeeId });

    if (existingEmployee) {
      return res.status(400).json({
        message: "Employee ID already exists"
      });
    }

    const newEmployee = await EmployeeDetail.create({
      userId: userId || null,
      name,
      number,
      employeeId,
      mailId,
      position,
      salary: Number(salary || 0),
      dob,
      birthMonth,
      gender,
      qualification,
      role,
      father,
      mother,
      parentsNo,
      address,
      dateOfJoin
    });

    res.status(201).json({
      message: "Employee details saved successfully",
      data: newEmployee
    });
  } catch (error) {
    console.error("saveEmployeeDetail error:", error);
    res.status(500).json({ message: error.message });
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
      father,
      mother,
      parentsNo,
      address,
      dateOfJoin
    } = req.body;

    if (!name || !employeeId || !mailId || !role) {
      return res.status(400).json({
        message: "Name, ID, Mail-ID and Role are required"
      });
    }

    const existingEmployeeWithSameId = await EmployeeDetail.findOne({
      employeeId,
      _id: { $ne: id }
    });

    if (existingEmployeeWithSameId) {
      return res.status(400).json({
        message: "Employee ID already exists"
      });
    }

    const updatedEmployee = await EmployeeDetail.findByIdAndUpdate(
      id,
      {
        userId: userId || null,
        name,
        number,
        employeeId,
        mailId,
        position,
        salary: Number(salary || 0),
        dob,
        birthMonth,
        gender,
        qualification,
        role,
        father,
        mother,
        parentsNo,
        address,
        dateOfJoin
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Employee details updated successfully",
      data: updatedEmployee
    });
  } catch (error) {
    console.error("updateEmployeeDetail error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployeeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEmployee = await EmployeeDetail.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

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
      dob: { $exists: true, $ne: "" }
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