import React from "react";
export default function ImportantTable({ incidents }) {
  if (!incidents.length) return null;

  return (
    <>
      <h2>Important Issues</h2>
      <table>
        <tbody>
          {incidents.map(i => (
            <tr key={i.id}>
              <td>{i.timestamp}</td>
              <td>{i.category}</td>
              <td>{i.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
