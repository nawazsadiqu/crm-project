import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";
import "../css/AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUsers(Array.isArray(res.data.users) ? res.data.users : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserStatus = (user) => {
    if (user.isActive === false) return "inactive";

    const status = String(
      user.employeeStatus || user.status || user.userStatus || "active"
    ).toLowerCase();

    return status === "inactive" ? "inactive" : "active";
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aStatus = getUserStatus(a);
      const bStatus = getUserStatus(b);

      if (aStatus === "active" && bStatus === "inactive") return -1;
      if (aStatus === "inactive" && bStatus === "active") return 1;

      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [users]);

  const activeCount = sortedUsers.filter(
    (user) => getUserStatus(user) === "active"
  ).length;

  const inactiveCount = sortedUsers.filter(
    (user) => getUserStatus(user) === "inactive"
  ).length;

  const getRoleClass = (role) => {
    return `role-${String(role || "").replace(/\s+/g, "-").toLowerCase()}`;
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h2>All Users</h2>
          <p>Manage employee accounts, roles and active status</p>
        </div>

        <div className="admin-users-counts">
          <div>
            <span>Total</span>
            <strong>{sortedUsers.length}</strong>
          </div>

          <div className="active">
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="inactive">
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      <div className="admin-users-card">
        {loading ? (
          <p className="admin-users-loading">Loading users...</p>
        ) : (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => {
                    const status = getUserStatus(user);

                    return (
                      <tr
                        key={user._id}
                        className={
                          status === "active"
                            ? "user-row-active"
                            : "user-row-inactive"
                        }
                      >
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>

                            <div>
                              <strong>{user.name || "-"}</strong>
                              <span>
                                {user.employeeId
                                  ? `ID: ${user.employeeId}`
                                  : user.position || "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>{user.email || "-"}</td>

                        <td>
                          <span className={`role-badge ${getRoleClass(user.role)}`}>
                            {String(user.role || "-")
                            .replace(/([a-z])([A-Z])/g, "$1 $2")
                            .toUpperCase()}
                          </span>
                        </td>

                        <td>
                          <span className={`status-badge ${status}`}>
                            {status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="admin-users-empty">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;