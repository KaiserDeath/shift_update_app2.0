import React from "react"
import { useEffect, useState } from "react";
import { getIncidents } from "./api/client";
import OperatorGate from "./components/OperatorGate";
import IncidentForm from "./components/IncidentForm";
import ImportantTable from "./components/ImportantTable";
import IncidentTable from "./components/IncidentTable";

export default function App() {
  const [operator, setOperator] = useState(
    sessionStorage.getItem("operator")
  );
  const [incidents, setIncidents] = useState([]);

  const loadIncidents = async () => {
    const data = await getIncidents();
    setIncidents(data);
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  if (!operator) {
    return <OperatorGate setOperator={setOperator} />;
  }

  const important = incidents.filter(i => i.status === "Important");
  const others = incidents.filter(i => i.status !== "Important");

  return (
    <div className="container">
      <h1>Shift Update App</h1>

      <IncidentForm operator={operator} onAdd={loadIncidents} />

      <ImportantTable incidents={important} />
      <IncidentTable incidents={others} />
    </div>
  );
}
