import User from "../models/User.js";

export const getAllUsersForHr = async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("getAllUsersForHr error:", error);
    res.status(500).json({ message: error.message });
  }
};