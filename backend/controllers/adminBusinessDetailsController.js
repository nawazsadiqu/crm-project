import EmployeeDetail from "../models/EmployeeDetail.js";
import FormDetail from "../models/FormDetail.js";
import User from "../models/User.js";
import PresentationDetail from "../models/PresentationDetail.js";

import {getRevenueBreakupByPaymentDate} from "../utils/revenueByPaymentDate.js";

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// get date range for daily / weekly / monthly
const getDateRange = (type, date) => {
  const d = new Date(date);

  let startDate, endDate;

  if (type === "daily") {
    startDate = new Date(d);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "weekly") {
  const temp =
    new Date(
      `${date}T12:00:00`
    );

  const day =
    temp.getDay();

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day;

  startDate =
    new Date(temp);

  startDate.setDate(
    temp.getDate() +
      mondayOffset
  );

  startDate.setHours(
    0,
    0,
    0,
    0
  );

  endDate =
    new Date(startDate);

  endDate.setDate(
    startDate.getDate() + 6
  );

  endDate.setHours(
    23,
    59,
    59,
    999
  );
} else if (type === "monthly") {
    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// GET all BA employees for dropdown

export const getAdminBaList = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["ba", "telecaller"] }
    })
      .select("_id name role")
      .lean();

    const profiles = await EmployeeDetail.find({
      userId: { $in: users.map((user) => user._id) }
    })
      .select("userId employeeId name")
      .lean();

    const profileMap = new Map(
      profiles.map((profile) => [
        String(profile.userId),
        profile
      ])
    );

    const employees = users
      .map((user) => {
        const profile = profileMap.get(String(user._id));

        return {
          userId: String(user._id),
          employeeId: profile?.employeeId || "-",
          name: profile?.name || user.name || "Unknown",
          role: user.role
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};


// GET business details based on BA + filter
export const getAdminBusinessDetails = async (req, res) => {
    try {
      const { userId, type, date} = req.query;

      if (!type) {
        return res
          .status(400)
          .json({
            message:
              "type is required"
          });
      }

      const filter = {};

      if (
        userId &&
        userId !== "all"
      ) {
        filter.userId =
          userId;
      }

      let selectedDateString = "";
      let weekStartString = "";
      let weekEndString = "";
      let monthString = "";

      if (type !== "all") {
        if (!date) {
          return res
            .status(400)
            .json({
              message:
                "date is required for daily, weekly, and monthly filters"
            });
        }

        const {
          startDate,
          endDate
        } = getDateRange(
          type,
          date
        );

        selectedDateString =
          formatDate(date);

        weekStartString =
          formatDate(
            startDate
          );

        weekEndString =
          formatDate(
            endDate
          );

        const selectedDate =
          new Date(date);

        monthString =
          `${selectedDate.getFullYear()}-${String(
            selectedDate.getMonth() +
              1
          ).padStart(2, "0")}`;

        if (type === "daily") {
          filter.date =
            selectedDateString;
        }

        if (type === "weekly") {
          filter.date = {
            $gte:
              weekStartString,
            $lte:
              weekEndString
          };
        }

        if (type === "monthly") {
          filter.date = {
            $regex:
              `^${monthString}`
          };
        }
      }


const businessRecords = await FormDetail.find(filter)
  .sort({ date: -1 })
  .lean();

// Load the linked appointments to identify the visiting BA.
const presentationIds = businessRecords
  .map((record) => record.sourcePresentationId)
  .filter(Boolean);

const presentations = await PresentationDetail.find({
  _id: { $in: presentationIds }
})
  .select("_id visitedByBaId dealClosedByBaId")
  .lean();

const presentationMap = new Map(
  presentations.map((item) => [
    String(item._id),
    item
  ])
);

// Collect both owners and visiting/closing BAs.
const employeeUserIds = [
  ...new Set(
    businessRecords.flatMap((record) => {
      const presentation = presentationMap.get(
        String(record.sourcePresentationId || "")
      );

      return [
        record.userId,
        record.fixedByTelecallerId,
        record.closedByBaId,
        presentation?.visitedByBaId,
        presentation?.dealClosedByBaId
      ]
        .filter(Boolean)
        .map(String);
    })
  )
];

const [employeeProfiles, linkedUsers] = await Promise.all([
  EmployeeDetail.find({
    userId: { $in: employeeUserIds }
  })
    .select("userId employeeId name")
    .lean(),

  User.find({
    _id: { $in: employeeUserIds }
  })
    .select("_id name")
    .lean()
]);

const employeeMap = new Map(
  employeeProfiles.map((employee) => [
    String(employee.userId),
    employee
  ])
);

const userMap = new Map(
  linkedUsers.map((user) => [
    String(user._id),
    user
  ])
);

const getEmployeeName = (id) => {
  const key = String(id || "");

  return (
    employeeMap.get(key)?.name ||
    userMap.get(key)?.name ||
    ""
  );
};

const getEmployeeId = (id) => {
  return (
    employeeMap.get(String(id || ""))?.employeeId ||
    ""
  );
};

const businessData = businessRecords.map((record) => {
  const isTelecallerDeal =
    record.dealSource === "telecaller";

  const presentation = presentationMap.get(
    String(record.sourcePresentationId || "")
  );

  // Original form owner.
  const ownerId = isTelecallerDeal
    ? record.fixedByTelecallerId || record.userId
    : record.userId;

  // Actual visiting BA, falling back to the closing BA.
  const visitingBaId =
    presentation?.visitedByBaId ||
    presentation?.dealClosedByBaId ||
    record.closedByBaId ||
    (isTelecallerDeal ? null : record.userId);

  return {
    ...record,

    formOwnerName:
      getEmployeeName(ownerId) ||
      (isTelecallerDeal ? "-" : record.baName || "-"),

    formOwnerEmployeeId:
      getEmployeeId(ownerId) ||
      (isTelecallerDeal ? "-" : record.baId || "-"),

    formOwnerRole:
      isTelecallerDeal ? "telecaller" : "ba",

    visitedBaName:
      getEmployeeName(visitingBaId) ||
      record.baName ||
      "-",

    visitedBaEmployeeId:
      getEmployeeId(visitingBaId) ||
      record.baId ||
      "-"
  };
});


      let revenueBreakup = {
        revenue: 0,
        exGst: 0,
        profitSharing: 0,
        details: []
      };

      if (type === "daily") {
        revenueBreakup =
          await getRevenueBreakupByPaymentDate(
            {
              userId:
                userId &&
                userId !== "all"
                  ? userId
                  : "",

              exactDate:
                selectedDateString
            }
          );
      }

      if (type === "weekly") {
        revenueBreakup =
          await getRevenueBreakupByPaymentDate(
            {
              userId:
                userId &&
                userId !== "all"
                  ? userId
                  : "",

              startDate:
                weekStartString,

              endDate:
                weekEndString
            }
          );
      }

      if (type === "monthly") {
        revenueBreakup =
          await getRevenueBreakupByPaymentDate(
            {
              userId:
                userId &&
                userId !== "all"
                  ? userId
                  : "",

              monthPrefix:
                monthString
            }
          );
      }

      if (type === "all") {
        revenueBreakup =
          await getRevenueBreakupByPaymentDate(
            {
              userId:
                userId &&
                userId !== "all"
                  ? userId
                  : "",

              allTime:
                true
            }
          );
      }

      const totalBusinesses =
        businessData.length;

      const totalPackageAmount =
        businessData.reduce(
          (sum, item) =>
            sum +
            Number(
              item.packageAmount ||
                item.revenue ||
                0
            ),
          0
        );

      const totalBalanceAmount =
        businessData.reduce(
          (sum, item) =>
            sum +
            Number(
              item.balanceAmount ||
                0
            ),
          0
        );

      res.status(200).json({
        businessData,

        summary: {
          totalBusinesses,
          totalRevenue: revenueBreakup.exGst,
          totalReceived: revenueBreakup.revenue,
          totalExGst: revenueBreakup.exGst,
          totalProfitSharing: revenueBreakup.profitSharing,
          totalPackageAmount,
          totalBalanceAmount
        }
      });
    } catch (error) {
      console.error(
        "Error fetching admin business details:",
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };