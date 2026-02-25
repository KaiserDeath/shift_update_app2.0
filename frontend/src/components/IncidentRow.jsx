import React from "react";
import { formatTimestamp } from "../utils/time";

function IncidentRow({ incident, onStatusChange, onDelete, onEdit }) {

  const handleChange = (e) => {
    onStatusChange(incident.id, e.target.value);
  };

  return (
    <tr>
      <td>{incident.shift}</td>
      <td>{formatTimestamp(incident.timestamp)}</td>
      <td>{incident.operator}</td>
      <td>{incident.company}</td>
      <td>{incident.category}</td>
      <td>{incident.description}</td>
      <td>{incident.action_taken}</td>

      <td>
        <select
          value={incident.status}
          onChange={handleChange}
        >
          <option value="Pending">Pending</option>
          <option value="Important">Important</option>
          <option value="Resolved">Resolved</option>
        </select>
      </td>

      {/* ✏ Edit Button */}
      <td>
        <button
          onClick={() => onEdit(incident)}
          style={{ background: "orange", color: "white" }}
        >
          Edit
        </button>
      </td>

      {/* 🗑 Delete Button */}
      <td>
        <button
          onClick={() => onDelete(incident.id)}
          style={{ background: "red", color: "white" }}
        >
          X
        </button>
      </td>
    </tr>
  );
}

export default IncidentRow;
