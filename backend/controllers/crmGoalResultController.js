import CrmGoalResult from "../models/CrmGoalResult.js";

const emptyValues = {
  posters: 0,
  reviewReplies: 0,
  contactEscalation: 0,
  otherEscalation: 0,
  clientsQuery: 0,
  schedulingPhotoshoot: 0,
  uploadingPhotoshoot: 0,
  contactReEscalation: 0,
  otherReEscalation: 0,
  monthlyReports: 0,
  clientDataRenewal: 0
};

const normalizeValues = (values = {}) => {
  const normalized = {};

  Object.keys(emptyValues).forEach((key) => {
    normalized[key] =
      Number(values[key] || 0);
  });

  return normalized;
};

/*
 * Monday -> Sunday
 *
 * Uses UTC date calculation so the
 * server timezone cannot shift weeks.
 */
const getWeekRange = (dateString) => {
  const [year, month, day] =
    String(dateString)
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  const dayOfWeek =
    date.getUTCDay();

  const diffToMonday =
    dayOfWeek === 0
      ? -6
      : 1 - dayOfWeek;

  const monday =
    new Date(date);

  monday.setUTCDate(
    date.getUTCDate() +
      diffToMonday
  );

  const sunday =
    new Date(monday);

  sunday.setUTCDate(
    monday.getUTCDate() + 6
  );

  return {
    startDate:
      monday
        .toISOString()
        .slice(0, 10),

    endDate:
      sunday
        .toISOString()
        .slice(0, 10)
  };
};

const getMonthRange = (
  dateString
) => {
  const monthPrefix =
    String(dateString).slice(
      0,
      7
    );

  const [year, month] =
    monthPrefix
      .split("-")
      .map(Number);

  const lastDay =
    new Date(
      Date.UTC(
        year,
        month,
        0
      )
    ).getUTCDate();

  return {
    monthPrefix,

    startDate:
      `${monthPrefix}-01`,

    endDate:
      `${monthPrefix}-${String(
        lastDay
      ).padStart(2, "0")}`
  };
};

/*
 * Add together the results from
 * multiple DAILY CRM records.
 */
const sumDailyResults = (
  records = []
) => {
  const totals = {
    ...emptyValues
  };

  records.forEach((record) => {
    Object.keys(
      emptyValues
    ).forEach((key) => {
      totals[key] +=
        Number(
          record?.results?.[
            key
          ] || 0
        );
    });
  });

  return totals;
};

const getSaveDate = (
  date,
  type
) => {
  if (type === "weekly") {
    return getWeekRange(
      date
    ).startDate;
  }

  if (type === "monthly") {
    return `${date.slice(
      0,
      7
    )}-01`;
  }

  return date;
};

/*
 * ===================================
 * GET CRM GOALS + RESULTS
 * ===================================
 */
export const getCrmGoalsAndResults =
  async (req, res) => {
    try {
      const {
        date,
        type
      } = req.query;

      if (!date || !type) {
        return res
          .status(400)
          .json({
            message:
              "Date and type are required"
          });
      }

      if (
        ![
          "daily",
          "weekly",
          "monthly"
        ].includes(type)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid CRM goal type"
          });
      }

      /*
       * -------------------------------
       * DAILY RECORD
       * -------------------------------
       */
      const dailyData =
        await CrmGoalResult.findOne(
          {
            userId:
              req.user.id,

            date,

            goalType:
              "daily"
          }
        );

      /*
       * -------------------------------
       * WEEKLY GOAL RECORD
       * -------------------------------
       */
      const {
        startDate:
          weekStartDate,

        endDate:
          weekEndDate
      } = getWeekRange(date);

      /*
       * Correct/new format:
       * weekly record is stored
       * on Monday.
       */
      let weeklyData =
        await CrmGoalResult.findOne(
          {
            userId:
              req.user.id,

            date:
              weekStartDate,

            goalType:
              "weekly"
          }
        );

      /*
       * Backward compatibility for
       * old weekly records which may
       * have been saved on another
       * day of the same week.
       */
      if (!weeklyData) {
        weeklyData =
          await CrmGoalResult.findOne(
            {
              userId:
                req.user.id,

              goalType:
                "weekly",

              date: {
                $gte:
                  weekStartDate,

                $lte:
                  weekEndDate
              }
            }
          ).sort({
            lastUpdatedAt: -1,
            updatedAt: -1
          });
      }

      /*
       * -------------------------------
       * MONTHLY GOAL RECORD
       * -------------------------------
       */
      const {
        monthPrefix,
        startDate:
          monthStartDate,
        endDate:
          monthEndDate
      } = getMonthRange(date);

      /*
       * Correct/new format:
       * monthly record is stored
       * on the first day.
       */
      let monthlyData =
        await CrmGoalResult.findOne(
          {
            userId:
              req.user.id,

            date:
              monthStartDate,

            goalType:
              "monthly"
          }
        );

      /*
       * Backward compatibility for
       * older monthly records.
       */
      if (!monthlyData) {
        monthlyData =
          await CrmGoalResult.findOne(
            {
              userId:
                req.user.id,

              goalType:
                "monthly",

              date: {
                $regex:
                  `^${monthPrefix}`
              }
            }
          ).sort({
            lastUpdatedAt: -1,
            updatedAt: -1
          });
      }

      /*
       * =================================
       * WEEKLY RESULTS
       *
       * Do NOT read weeklyData.results.
       *
       * Sum DAILY result records instead.
       * =================================
       */
      const weeklyDailyRecords =
        await CrmGoalResult.find(
          {
            userId:
              req.user.id,

            goalType:
              "daily",

            date: {
              $gte:
                weekStartDate,

              $lte:
                weekEndDate
            }
          }
        )
          .select(
            "date results lastUpdatedAt updatedAt"
          )
          .lean();

      const weeklyResults =
        sumDailyResults(
          weeklyDailyRecords
        );

      /*
       * =================================
       * MONTHLY RESULTS
       *
       * Sum all DAILY results
       * inside selected month.
       * =================================
       */
      const monthlyDailyRecords =
        await CrmGoalResult.find(
          {
            userId:
              req.user.id,

            goalType:
              "daily",

            date: {
              $gte:
                monthStartDate,

              $lte:
                monthEndDate
            }
          }
        )
          .select(
            "date results lastUpdatedAt updatedAt"
          )
          .lean();

      const monthlyResults =
        sumDailyResults(
          monthlyDailyRecords
        );

      /*
       * Latest update information
       */
      let selectedData = null;

      if (type === "daily") {
        selectedData =
          dailyData;
      }

      if (type === "weekly") {
        selectedData =
          weeklyData;
      }

      if (type === "monthly") {
        selectedData =
          monthlyData;
      }

      /*
       * Return same response shape
       * expected by existing frontend.
       */
      res.status(200).json({
        dailyGoals: {
          ...emptyValues,
          ...(
            dailyData?.goals ||
            {}
          )
        },

        weeklyGoals: {
          ...emptyValues,
          ...(
            weeklyData?.goals ||
            {}
          )
        },

        monthlyGoals: {
          ...emptyValues,
          ...(
            monthlyData?.goals ||
            {}
          )
        },

        /*
         * Daily is still manually entered.
         */
        dailyResults: {
          ...emptyValues,
          ...(
            dailyData?.results ||
            {}
          )
        },

        /*
         * These two are now CALCULATED.
         */
        weeklyResults,

        monthlyResults,

        lastUpdatedAt:
          selectedData
            ?.lastUpdatedAt ||
          null,

        lastUpdatedBy:
          selectedData
            ?.lastUpdatedBy ||
          null
      });
    } catch (error) {
      console.error(
        "getCrmGoalsAndResults error:",
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };

/*
 * ===================================
 * SAVE CRM GOALS + RESULTS
 * ===================================
 */
export const saveCrmGoalsAndResults =
  async (req, res) => {
    try {
      const {
        date,
        type,

        dailyGoals,
        weeklyGoals,
        monthlyGoals,

        dailyResults
      } = req.body;

      if (!date || !type) {
        return res
          .status(400)
          .json({
            message:
              "Date and type are required"
          });
      }

      if (
        ![
          "daily",
          "weekly",
          "monthly"
        ].includes(type)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid CRM goal type"
          });
      }

      const saveDate =
        getSaveDate(
          date,
          type
        );

      let goals = {
        ...emptyValues
      };

      let results = {
        ...emptyValues
      };

      /*
       * DAILY:
       *
       * Goals = manual
       * Results = manual
       */
      if (type === "daily") {
        goals =
          normalizeValues(
            dailyGoals
          );

        results =
          normalizeValues(
            dailyResults
          );
      }

      /*
       * WEEKLY:
       *
       * Goal = manual
       * Result = NOT stored manually.
       *
       * It is calculated from
       * daily records during GET.
       */
      if (type === "weekly") {
        goals =
          normalizeValues(
            weeklyGoals
          );

        results = {
          ...emptyValues
        };
      }

      /*
       * MONTHLY:
       *
       * Goal = manual
       * Result = calculated
       * from daily records.
       */
      if (type === "monthly") {
        goals =
          normalizeValues(
            monthlyGoals
          );

        results = {
          ...emptyValues
        };
      }

      const savedRecord =
        await CrmGoalResult.findOneAndUpdate(
          {
            userId:
              req.user.id,

            date:
              saveDate,

            goalType:
              type
          },

          {
            userId:
              req.user.id,

            date:
              saveDate,

            goalType:
              type,

            goals,

            /*
             * Weekly/monthly stay zero
             * in DB intentionally.
             *
             * Calculated result is never
             * taken from this field.
             */
            results,

            lastUpdatedAt:
              new Date(),

            lastUpdatedBy:
              req.user.id
          },

          {
            new: true,
            upsert: true,
            runValidators: true
          }
        );

      res.status(200).json({
        message:
          type === "daily"
            ? "Daily CRM goals and results saved successfully"
            : type === "weekly"
            ? "Weekly CRM goals saved successfully"
            : "Monthly CRM goals saved successfully",

        data:
          savedRecord
      });
    } catch (error) {
      console.error(
        "saveCrmGoalsAndResults error:",
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };