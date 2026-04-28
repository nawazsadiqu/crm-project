import { useEffect, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";

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

  // 👤 UNIQUE USERS
  const users = [
    ...new Map(
      attendance.map((item) => [
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
    (a) => a.status === "Present"
  ).length;

  const totalAbsent = filteredData.filter(
    (a) => a.status === "Absent"
  ).length;

  const totalDays = filteredData.length;

  // 📅 CALENDAR MAP
  const attendanceMap = {};
  filteredData.forEach((item) => {
    const day = new Date(item.date).getDate();
    attendanceMap[day] = item.status;
  });

  const daysInMonth = 31;

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

  return (
    <div>

      {/* 📊 SUMMARY CARDS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>

        <div className="dashboard-card">
          <h3>Total Days</h3>
          <p>{totalDays}</p>
        </div>

        <div className="dashboard-card">
          <h3>Present</h3>
          <p style={{ color: "green" }}>{totalPresent}</p>
        </div>

        <div className="dashboard-card">
          <h3>Absent</h3>
          <p style={{ color: "red" }}>{totalAbsent}</p>
        </div>

      </div>

      {/* 🎯 CONTROLS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>

        {/* 👤 EMPLOYEE */}
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            minWidth: "200px"
          }}
        >
          <option value="">Select Employee</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
            {user.id} - {user.name.toUpperCase()}
            </option>
          ))}
        </select>

        {/* 📅 MONTH */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd"
          }}
        >
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

      {/* 📅 CALENDAR */}
      <div className="dashboard-card">

        <h3>Attendance Calendar</h3>

        {!selectedUser ? (
          <p className="empty-text">Please select an employee</p>
        ) : loading ? (
          <p className="empty-text">Loading...</p>
        ) : month ? (
          // 📅 SINGLE MONTH VIEW
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px",
              marginTop: "15px"
            }}
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
              (day) => {
                const status = attendanceMap[day];

                return (
                  <div
                    key={day}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      textAlign: "center",
                      border: "1px solid #ddd",
                      background:
                        status === "Present"
                          ? "#d1fae5"
                          : status === "Absent"
                          ? "#fee2e2"
                          : "#f3f4f6"
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Day {day}
                    </div>

                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                      {status === "Present"
                        ? "P"
                        : status === "Absent"
                        ? "A"
                        : "-"}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          // 📅 ALL MONTHS VIEW
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {sortedMonths.map((monthData, idx) => (
              <div key={idx}>
                <h4 style={{ marginBottom: "10px" }}>
                  {monthData.name}
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "10px"
                  }}
                >
                  {monthData.data.map((item) => {
                    const day = new Date(item.date).getDate();

                    return (
                      <div
                        key={item._id}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                          background:
                            item.status === "Present"
                              ? "#d1fae5"
                              : "#fee2e2"
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Day {day}
                        </div>

                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                          {item.status === "Present" ? "P" : "A"}
                        </div>
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