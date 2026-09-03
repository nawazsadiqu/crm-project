import EmployeeDetail from "../models/EmployeeDetail.js";
import FormDetail from "../models/FormDetail.js";

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
    const baEmployees = await EmployeeDetail.find({ role: "ba" })
      .select("employeeId name userId role")
      .sort({ name: 1 });

    res.status(200).json(baEmployees);
  } catch (error) {
    console.error("Error fetching BA list:", error);
    res.status(500).json({ message: error.message });
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

      const businessData =
        await FormDetail.find(
          filter
        ).sort({
          date: -1
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