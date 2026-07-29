import { useEffect, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";
import "../css/adminAttendance.css";

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(
        "/api/admin/attendance",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAttendance(res.data.data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const users = [
  ...new Map(
    attendance
      .filter((item) => {
        return (
          item.isActive !== false &&
          item.employeeStatus !== "Inactive" &&
          item.userStatus !== "Inactive"
        );
      })
      .map((item) => [
        item.employeeId,
        {
          id: item.employeeId,
          name: item.employeeName
        }
      ])
  ).values()
];

  // 🎯 BASE EMPLOYEE DATA
  const employeeAttendance = selectedUser
    ? attendance.filter((item) => item.employeeId === selectedUser)
    : [];

  // 📅 MONTH FILTER (USED EVERYWHERE)
  const filteredData = employeeAttendance.filter((item) => {
    const itemMonth = new Date(item.date).getMonth() + 1;
    return month ? itemMonth === Number(month) : true;
  });

  // 📊 SUMMARY (FIXED → NOW MATCHES MONTH + EMPLOYEE)
  const totalPresent = filteredData.filter(
  (item) => item.status === "Present"
).length;

const totalAbsent = filteredData.filter(
  (item) => item.status === "Absent"
).length;

const totalHalfDay = filteredData.filter(
  (item) => item.status === "Half Day"
).length;

/*
  One Absent = 1 leave
  Two Half Days = 1 leave
*/
const totalLeaveDays =
  totalAbsent + totalHalfDay / 2;

const displayedLeaveDays =
  Number.isInteger(totalLeaveDays)
    ? totalLeaveDays
    : totalLeaveDays.toFixed(1);

const totalDays = filteredData.length;

  // 📅 CALENDAR MAP
  const attendanceMap = {};
  filteredData.forEach((item) => {
    const day = new Date(item.date).getDate();
    attendanceMap[day] = item.status;
  });

  const selectedYear = new Date().getFullYear();

  const daysInMonth = month
    ? new Date(selectedYear, Number(month), 0).getDate()
    : 31;

  // 📅 ALL MONTHS GROUPING
  const groupedByMonth = employeeAttendance.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthIndex = date.getMonth();

    const monthName = date.toLocaleString("default", {
      month: "long"
    });

    if (!acc[monthIndex]) {
      acc[monthIndex] = {
        name: monthName,
        data: []
      };
    }

    acc[monthIndex].data.push(item);

    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedByMonth)
    .sort((a, b) => a - b)
    .map((key) => groupedByMonth[key]);

    const getDayName = (dateValue) => {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-IN", {
    weekday: "long"
  });
};

  return (
  <div className="attendance-page">
    <div className="attendance-header-card">
      <div>
        <h2>Admin Attendance</h2>
        <p>View employee-wise attendance summary and calendar</p>
      </div>
    </div>

    <div className="attendance-summary-grid">
  <div className="attendance-summary-card">
    <span>Total Days</span>
    <h3>{totalDays}</h3>
  </div>

  <div className="attendance-summary-card present">
    <span>Present</span>
    <h3>{totalPresent}</h3>
  </div>

  <div className="attendance-summary-card absent">
    <span>Absent</span>
    <h3>{totalAbsent}</h3>
  </div>

  <div className="attendance-summary-card half-day">
    <span>Half Day</span>
    <h3>{totalHalfDay}</h3>
  </div>

  <div className="attendance-summary-card leave">
    <span>Total Leave Days</span>
    <h3>{displayedLeaveDays}</h3>
  </div>
</div>

    <div className="attendance-controls-card">
      <div className="attendance-control-group">
        <label>Employee</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select Employee</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.id} - {user.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="attendance-control-group">
        <label>Month</label>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">All Months</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
    </div>

    <div className="attendance-calendar-card">
      <div className="attendance-calendar-header">
        <div>
          <h3>Attendance Calendar</h3>
          <p>
            {selectedUser
              ? month
                ? "Monthly attendance view"
                : "All months attendance view"
              : "Please select an employee"}
          </p>
        </div>

        {selectedUser && (
          <div className="attendance-legend">
  <span className="legend-present">P</span>
  <small>Present</small>

  <span className="legend-absent">A</span>
  <small>Absent</small>

  <span className="legend-half-day">HD</span>
  <small>Half Day</small>
</div>
        )}
      </div>

      {!selectedUser ? (
        <p className="attendance-empty">Please select an employee</p>
      ) : loading ? (
        <p className="attendance-empty">Loading...</p>
      ) : month ? (
        <div className="attendance-calendar-grid">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const status = attendanceMap[day];

            return (
              <div
                key={day}
                className={`attendance-day-card ${
  status === "Present"
    ? "present"
    : status === "Absent"
    ? "absent"
    : status === "Half Day"
    ? "half-day"
    : "empty"
}`}
              >
                <span>Day {day}</span>

                <small className="attendance-day-name">
                  {getDayName(
                    `${selectedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(
                      2,
                      "0"
                    )}`
                  )}
                </small>

                <strong>
  {status === "Present"
    ? "P"
    : status === "Absent"
    ? "A"
    : status === "Half Day"
    ? "HD"
    : "-"}
</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="attendance-all-months">
          {sortedMonths.map((monthData, idx) => (
            <div key={idx} className="attendance-month-block">
              <h4>{monthData.name}</h4>

              <div className="attendance-calendar-grid">
                {monthData.data.map((item) => {
                  const day = new Date(item.date).getDate();

                  return (
                    <div
                      key={item._id}
                      className={`attendance-day-card ${
  item.status === "Present"
    ? "present"
    : item.status === "Absent"
    ? "absent"
    : item.status === "Half Day"
    ? "half-day"
    : "empty"
}`}
                    >
                      <span>Day {day}</span>

                      <small className="attendance-day-name">
                        {getDayName(item.date)}
                      </small>

                      <strong>
  {item.status === "Present"
    ? "P"
    : item.status === "Absent"
    ? "A"
    : item.status === "Half Day"
    ? "HD"
    : "-"}
</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
};

export default AdminAttendance;