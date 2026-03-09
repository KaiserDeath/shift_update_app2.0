import React from "react";
import IncidentRow from "./IncidentRow";

function IncidentTable({ 
  incidents, 
  onStatusChange, 
  onDelete, 
  onEdit,
  variant 
}) {

  const getTableTitle = () => {
    switch (variant) {
      case "important": return "Important Incidents";
      case "pending": return "Pending Incidents";
      case "resolved": return "Resolved Incidents";
      default: return "All Incidents";
    }
  };

  return (
    <div className="incident-table-container">
      <h3>{getTableTitle()}</h3>

      <table 
        className={`incident-table ${variant || ""}`}
        border="1" 
        cellPadding="5" 
        cellSpacing="0"
      >
        <thead>
          <tr>
            <th>Shift</th>
            <th>Timestamp</th>
            <th>Operator</th>
            <th>Company</th>
            <th>Category</th>
            <th>Description</th>
            <th>Action Taken</th>
            <th>Status</th>
            {/* ✅ NEW: Add Resolution Column Header only for Resolved table */}
            {variant === "resolved" && <th>Resolution Info</th>}
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {incidents.map((incident) => (
            <IncidentRow
              key={incident.id}
              incident={incident}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
              isResolvedView={variant === "resolved"} // Pass this prop down
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IncidentTable;