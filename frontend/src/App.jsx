import React, { useEffect, useState } from "react";
import IncidentForm from "./components/IncidentForm";
import IncidentTable from "./components/IncidentTable";
import ImportantTable from "./components/ImportantTable";

function App() {

  const [incidents, setIncidents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIncident, setEditingIncident] = useState(null);

  // ✅ NEW — Filter state
  const [filters, setFilters] = useState({
    company: "",
    category: "",
    search: "",
    date_from: "",
    date_to: ""
  });

  const operator = "Operator";

  // 🔁 Reload whenever filters change
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async (activeFilters = filters) => {
    try {
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v)
      );

      const query = new URLSearchParams(cleanFilters).toString();

      const incidentsRes = await fetch(
        `http://127.0.0.1:5000/incidents?${query}`
      );
      const incidentsData = await incidentsRes.json();
      setIncidents(incidentsData);

      // Companies
      const companiesRes = await fetch("http://127.0.0.1:5000/companies");
      const companiesData = await companiesRes.json();
      setCompanies(companiesData);

      // Categories
      const categoriesRes = await fetch("http://127.0.0.1:5000/categories");
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // ✅ Add Incident
  const addIncident = async (incident) => {
    const response = await fetch("http://127.0.0.1:5000/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident)
    });

    const savedIncident = await response.json();
    setIncidents(prev => [savedIncident, ...prev]);
  };

  // ✅ Update status
  const updateStatus = async (id, newStatus) => {
    const incident = incidents.find(i => i.id === id);

    const updatedIncident = {
      ...incident,
      status: newStatus
    };

    await updateIncident(updatedIncident);
  };

  // ✅ Delete
  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident?")) return;

    await fetch(`http://127.0.0.1:5000/incidents/${id}`, {
      method: "DELETE"
    });

    setIncidents(prev =>
      prev.filter(incident => incident.id !== id)
    );
  };

  // 🔁 Full update
  const updateIncident = async (updatedIncident) => {
    await fetch(`http://127.0.0.1:5000/incidents/${updatedIncident.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedIncident)
    });

    // Reload to get updated timestamp
    loadData();

    setEditingIncident(null);
  };

  // 🔥 Keep your separation logic EXACTLY as before
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

      {/* ✅ FILTER SECTION */}
      <div style={{ marginBottom: "20px", marginTop: "20px" }}>
        <select
          value={filters.company}
          onChange={(e) =>
            setFilters({ ...filters, company: e.target.value })
          }
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
          style={{ marginLeft: "10px" }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
          style={{ marginLeft: "10px" }}
        />

        <input
          type="date"
          value={filters.date_from}
          onChange={(e) =>
            setFilters({ ...filters, date_from: e.target.value })
          }
          style={{ marginLeft: "10px" }}
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={(e) =>
            setFilters({ ...filters, date_to: e.target.value })
          }
          style={{ marginLeft: "10px" }}
        />
      </div>

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
