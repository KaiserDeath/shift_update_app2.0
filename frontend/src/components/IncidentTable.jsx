import React from "react";
export default function IncidentTable({ incidents }) {
  return (
    <>
      <h2>Shift Log</h2>
      <table>
        <tbody>
          {incidents.map(i => (
            <tr key={i.id}>
              <td>{i.timestamp}</td>
              <td>{i.category}</td>
              <td>{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
