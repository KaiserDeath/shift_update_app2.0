import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const AdminPanel = ({ user }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Username: user.username }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [user]);

  // Create user
  const handleCreateUser = async () => {
    if (!username || !password || !role) {
      setMessage("All fields are required");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/admin/create-user`,
        { admin_username: user.username, username, password, role },
        { headers: { "Content-Type": "application/json" } }
      );
      setMessage(res.data.message);
      setUsername(""); setPassword(""); setRole("operator");
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || "Server error");
    }
  };

  // Delete user
  const deleteUser = async (usernameToDelete) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${usernameToDelete}`, {
        headers: { Username: user.username }
      });
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Reset password
  const resetPassword = async (usernameToReset) => {
    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    try {
      await axios.patch(`${API_URL}/admin/users/${usernameToReset}/password`, 
        { password: newPass },
        { headers: { Username: user.username } }
      );
      alert("Password reset successfully");
    } catch (err) {
      console.error("Error resetting password:", err);
    }
  };

  // Update role
  const updateRole = async (usernameToUpdate, newRole) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${usernameToUpdate}/role`,
        { role: newRole },
        { headers: { Username: user.username } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  return (
    <div style={{ marginTop: "40px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Admin Panel - Create User</h2>

      {/* Create User Form */}
      <input
        type="text" placeholder="Username" value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      />
      <input
        type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      />
      <select
        value={role} onChange={e => setRole(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      >
        <option value="operator">Operator</option>
        <option value="supervisor">Supervisor</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={handleCreateUser}
        style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Create User
      </button>

      {message && <p style={{ marginTop: "10px", color: message.toLowerCase().includes("error") ? "red" : "green" }}>{message}</p>}

      {/* Toggle Users Table */}
      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => setShowUsers(!showUsers)}
          style={{ padding: "10px 20px", marginBottom: "10px" }}
        >
          {showUsers ? "Hide Users" : "Show Users"}
        </button>

        {showUsers && (
          <>
            <h3>Existing Users</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.username} style={{ borderBottom: "1px solid #ccc" }}>
                    <td>{u.username}</td>
                    <td>
                      <select value={u.role} onChange={e => updateRole(u.username, e.target.value)}>
                        <option value="operator">Operator</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => resetPassword(u.username)}>Reset Password</button>
                      <button onClick={() => deleteUser(u.username)} style={{ marginLeft: "5px", backgroundColor: "#f44336", color: "white" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;