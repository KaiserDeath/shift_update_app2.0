import React from "react";
import { formatTimestamp } from "../utils/time";

function IncidentRow({ incident, onStatusChange, onDelete, onEdit }) {

  // Logic Preserved: Handles status updates via the parent function
  const handleChange = (e) => {
    onStatusChange(incident.id, e.target.value);
  };

  return (
    <tr className={`incident-row ${incident.status.toLowerCase()}`}>
      <td>{incident.shift}</td>
      <td>{formatTimestamp(incident.timestamp)}</td>
      <td style={{ fontWeight: "bold" }}>{incident.operator}</td>
      <td>{incident.company}</td>
      <td><span className="badge">{incident.category}</span></td>
      <td>{incident.description}</td>
      <td>{incident.action_taken || "N/A"}</td>

      <td>
        <select
          value={incident.status}
          onChange={handleChange}
          className={`status-select ${incident.status.toLowerCase()}`}
        >
          <option value="Pending">Pending</option>
          <option value="Important">Important</option>
          <option value="Resolved">Resolved</option>
        </select>
      </td>

      {/* Logic Preserved & Merged: Edit and Delete buttons now use icons in one cell */}
      <td style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center" }}>
          {/* ✏ Edit Icon-Button */}
          <button
            onClick={() => onEdit(incident)}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              fontSize: "16px",
              padding: "4px" 
            }}
            title="Edit Incident"
          >
            ✏️
          </button>

          {/* 🗑 Delete Icon-Button (Previously 'X') */}
          <button
            onClick={() => onDelete(incident.id)}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              fontSize: "16px",
              padding: "4px"
            }}
            title="Delete Incident"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

export default IncidentRow;