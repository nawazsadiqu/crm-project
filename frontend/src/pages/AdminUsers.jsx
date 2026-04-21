import { useEffect, useState } from "react";
import axios from "axios";
import "../CSS/dashboard.css"; 
import "../CSS/AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

 const fetchUsers = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("API RESPONSE:", res.data);

    // ✅ SAFE ASSIGNMENT
    setUsers(res.data.users || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    setUsers([]); // fallback
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="dashboard-card">
      <h2 className="dashboard-section-title">All Users</h2>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {Array.isArray(users) && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="role-badge">{user.role}</td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;