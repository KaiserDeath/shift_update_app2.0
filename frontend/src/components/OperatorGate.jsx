import React, { useState } from "react";

function OperatorGate({ onLogin }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Enter Operator Name</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Operator name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}

export default OperatorGate;
