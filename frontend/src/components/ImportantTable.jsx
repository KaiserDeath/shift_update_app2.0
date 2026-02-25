import React from "react";
import IncidentRow from "./IncidentRow";
import { formatTimestamp } from "../utils/time";

function ImportantTable({ incidents, onStatusChange, onDelete, onEdit }) {

  return (
    <div>
      <h3>Important Incidents</h3>

      <table 
        className="incident-table important"
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
            <th>Edit</th>
            <th>Delete</th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ImportantTable;
