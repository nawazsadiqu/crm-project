import UserActivity from "../models/UserActivity.js";

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

export const activityPing = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = getTodayDate();

    const activity = await UserActivity.findOneAndUpdate(
      { userId, date },
      {
        $setOnInsert: {
          userId,
          date,
          loginTime: new Date()
        },
        $set: {
          lastActiveAt: new Date(),
          logoutTime: null
        },
        $inc: {
          totalActiveSeconds: 60
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json({
      message: "Activity updated",
      data: activity
    });
  } catch (error) {
    console.error("activityPing error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const activityLogout = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = getTodayDate();

    const activity = await UserActivity.findOneAndUpdate(
      { userId, date },
      {
        logoutTime: new Date(),
        lastActiveAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      message: "Activity logout updated",
      data: activity
    });
  } catch (error) {
    console.error("activityLogout error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserActivitySummary = async (req, res) => {
  try {
    const { date = getTodayDate() } = req.query;

    const activities = await UserActivity.find({ date })
      .populate("userId", "name email role employeeId")
      .sort({ totalActiveSeconds: -1 });

    const formatted = activities.map((activity) => ({
      _id: activity._id,
      userId: activity.userId?._id,
      name: activity.userId?.name || "-",
      email: activity.userId?.email || "-",
      role: activity.userId?.role || "-",
      employeeId: activity.userId?.employeeId || "-",
      date: activity.date,
      loginTime: activity.loginTime,
      logoutTime: activity.logoutTime,
      lastActiveAt: activity.lastActiveAt,
      totalActiveSeconds: activity.totalActiveSeconds,
      isOnline:
        activity.lastActiveAt &&
        Date.now() - new Date(activity.lastActiveAt).getTime() < 2 * 60 * 1000
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getUserActivitySummary error:", error);
    res.status(500).json({ message: error.message });
  }
};