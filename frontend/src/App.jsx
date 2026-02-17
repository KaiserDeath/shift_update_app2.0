import React, { useEffect, useState } from "react";
import IncidentForm from "./components/IncidentForm";
import IncidentTable from "./components/IncidentTable";
import ImportantTable from "./components/ImportantTable";

function App() {

  const [incidents, setIncidents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIncident, setEditingIncident] = useState(null);

  const operator = "Operator";

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const incidentsRes = await fetch("http://127.0.0.1:5000/incidents");
    const incidentsData = await incidentsRes.json();
    setIncidents(incidentsData);

    const companiesRes = await fetch("http://127.0.0.1:5000/companies");
    const companiesData = await companiesRes.json();
    setCompanies(companiesData);

    const categoriesRes = await fetch("http://127.0.0.1:5000/categories");
    const categoriesData = await categoriesRes.json();
    setCategories(categoriesData);
  };

  // ✅ FIXED — Now saves to backend properly
  const addIncident = async (incident) => {
    const response = await fetch("http://127.0.0.1:5000/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident)
    });

    const savedIncident = await response.json();

    setIncidents(prev => [savedIncident, ...prev]);
  };

  // ✅ FIXED — Now sends full object
  const updateStatus = async (id, newStatus) => {
    const incident = incidents.find(i => i.id === id);

    const updatedIncident = {
      ...incident,
      status: newStatus
    };

    await updateIncident(updatedIncident);
  };

  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident?")) return;

    await fetch(`http://127.0.0.1:5000/incidents/${id}`, {
      method: "DELETE"
    });

    setIncidents(prev =>
      prev.filter(incident => incident.id !== id)
    );
  };

  // 🔁 FULL UPDATE
  const updateIncident = async (updatedIncident) => {
    await fetch(`http://127.0.0.1:5000/incidents/${updatedIncident.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedIncident)
    });

    // Reload from backend to get updated timestamp
    loadData();

    setEditingIncident(null);
  };

  const importantIncidents = incidents.filter(
    i => i.status === "Important"
  );

  const otherIncidents = incidents.filter(
    i => i.status !== "Important"
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Shift Log System</h2>

      <IncidentForm
        onAdd={addIncident}
        onUpdate={updateIncident}
        editingIncident={editingIncident}
        companies={companies}
        setCompanies={setCompanies}
        categories={categories}
        setCategories={setCategories}
        operator={operator}
      />

      <ImportantTable
        incidents={importantIncidents}
        onStatusChange={updateStatus}
        onDelete={deleteIncident}
        onEdit={setEditingIncident}
      />

      <IncidentTable
        incidents={otherIncidents}
        onStatusChange={updateStatus}
        onDelete={deleteIncident}
        onEdit={setEditingIncident}
      />
    </div>
  );
}

export default App;
