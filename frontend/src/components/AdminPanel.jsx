import React, { useState } from "react";
import axios from "axios";

const AdminPanel = ({ user }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("operator");
    const [message, setMessage] = useState("");

    const handleCreateUser = async () => {
        if (!user || user.role !== "admin") {
            setMessage("You must be logged in as admin to create users.");
            return;
        }

        if (!username || !password || !role) {
            setMessage("All fields are required");
            return;
        }

        try {
            // ✅ Include admin_username in body as backend expects
            const response = await axios.post(
                "http://localhost:5000/admin/create-user",
                {
                    admin_username: user.username, // ← REQUIRED BY BACKEND
                    username,
                    password,
                    role
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Username": user.username, // optional extra
                        "Role": user.role          // optional extra
                    }
                }
            );

            setMessage(response.data.message);
            setUsername("");
            setPassword("");
            setRole("operator");

        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.error || "Error creating user");
            } else {
                setMessage("Server error");
            }
        }
    };

    return (
        <div style={{
            marginTop: "40px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            maxWidth: "400px"
        }}>
            <h2>Admin Panel - Create User</h2>

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
            />

            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
            >
                <option value="operator">Operator</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
            </select>

            <button
                onClick={handleCreateUser}
                style={{
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                }}
            >
                Create User
            </button>

            {message && (
                <p style={{
                    marginTop: "10px",
                    color: message.toLowerCase().includes("error") ? "red" : "green"
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default AdminPanel;