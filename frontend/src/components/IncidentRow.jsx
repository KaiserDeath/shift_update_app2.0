import React, { useState } from "react";
import { formatTimestamp } from "../utils/time";

function IncidentRow({ incident, onStatusChange, onDelete, onEdit, isResolvedView }) {
  const [showResInput, setShowResInput] = useState(false);
  const [resText, setResText] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleStatusChange = (e) => {
    const val = e.target.value;
    if (val === "Resolved") {
      setShowResInput(true); // Open the centered window
    } else {
      onStatusChange(incident.id, val);
    }
  };

  const handleConfirm = () => {
    if (resText.trim()) {
      onStatusChange(incident.id, "Resolved", resText);
      setShowResInput(false);
      setResText("");
    }
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
        <select value={incident.status} onChange={handleStatusChange} className={`status-select ${incident.status.toLowerCase()}`}>
          <option value="Pending">Pending</option>
          <option value="Important">Important</option>
          <option value="Resolved">Resolved</option>
        </select>
      </td>

      {/* VIEW RESOLUTION ICON */}
      {isResolvedView && (
        <td style={{ textAlign: "center", position: "relative" }}>
          <button onClick={() => setShowInfo(!showInfo)} className="res-info-btn">ℹ️</button>
          {showInfo && (
            <div className="resolution-popover info-view">
              <div className="popover-header"><span>Resolution Details</span></div>
              <div className="popover-body">{incident.resolution}</div>
              <div className="popover-arrow"></div>
            </div>
          )}
        </td>
      )}

      {/* ACTIONS */}
      <td style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={() => onEdit(incident)} className="action-icon-btn">✏️</button>
          <button onClick={() => onDelete(incident.id)} className="action-icon-btn">🗑️</button>
        </div>
      </td>

      {/* THE CENTERED RESOLUTION MODAL (Grows from center) */}
      {showResInput && (
        <div className="modal-overlay">
          <div className="hub-modal-window">
            <div className="modal-header">
              <h3>Finalize Resolution</h3>
              <button onClick={() => setShowResInput(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Enter the final steps taken to resolve this incident:</p>
              <textarea 
                autoFocus 
                value={resText} 
                onChange={(e) => setResText(e.target.value)}
                placeholder="Ex: Refunding the user, reset terminal..."
              />
              <button className="confirm-btn" onClick={handleConfirm}>Confirm & Close</button>
            </div>
          </div>
        </div>
      )}
    </tr>
  );
}

export default IncidentRow;