import React, { useState, useEffect } from "react";
import Popup from "./Popup";

// Dynamically get API URL from env, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Popup state
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  const closePopup = () => setPopupState(prev => ({ ...prev, isOpen: false }));

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      onLogin(JSON.parse(savedUser));
    }
  }, [onLogin]);

  const handleLogin = async () => {
    if (!username || !password) {
      setPopupState({
        isOpen: true,
        title: "Input Required",
        message: "Username and password required",
        type: "alert",
        onConfirm: closePopup
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user info to localStorage to persist login
        localStorage.setItem("user", JSON.stringify(data));
        onLogin(data);
      } else {
        setPopupState({
          isOpen: true,
          title: "Login Failed",
          message: data.error,
          type: "alert",
          onConfirm: closePopup
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setPopupState({
        isOpen: true,
        title: "Error",
        message: "Server error. Try again.",
        type: "alert",
        onConfirm: closePopup
      });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <button
        onClick={handleLogin}
        style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Login
      </button>

      <Popup 
        isOpen={popupState.isOpen}
        onClose={closePopup}
        title={popupState.title}
        message={popupState.message}
        type={popupState.type}
        onConfirm={popupState.onConfirm}
      />
    </div>
  );
}

export default Login;