import React, { useEffect, useState } from "react";
import IncidentForm from "./components/IncidentForm";
import IncidentTable from "./components/IncidentTable";
import ImportantTable from "./components/ImportantTable";

function App() {

  const [incidents, setIncidents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIncident, setEditingIncident] = useState(null);

  const [filters, setFilters] = useState({
    company: "",
    category: "",
    search: "",
    date_from: "",
    date_to: ""
  });

  const operator = "Operator";

  // 🌗 DARK MODE STATE (persistent)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Apply theme to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async (activeFilters = filters) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v)
      );

      const query = new URLSearchParams(cleanFilters).toString();

      const incidentsRes = await fetch(
        `http://127.0.0.1:5000/incidents?${query}`
      );
      const incidentsData = await incidentsRes.json();
      setIncidents(incidentsData);

      const companiesRes = await fetch("http://127.0.0.1:5000/companies");
      const companiesData = await companiesRes.json();
      setCompanies(companiesData);

      const categoriesRes = await fetch("http://127.0.0.1:5000/categories");
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // ✅ ADD INCIDENT
  const addIncident = async (incident) => {
    await fetch("http://127.0.0.1:5000/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident)
    });

    await loadData();
  };

  // ✅ STATUS UPDATE (timestamp NOT modified)
  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`http://127.0.0.1:5000/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      // Local update only
      setIncidents(prev =>
        prev.map(incident =>
          incident.id === id
            ? { ...incident, status: newStatus }
            : incident
        )
      );

    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // ✅ DELETE
  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident?")) return;

    await fetch(`http://127.0.0.1:5000/incidents/${id}`, {
      method: "DELETE"
    });

    setIncidents(prev =>
      prev.filter(incident => incident.id !== id)
    );
  };

  // ✅ FULL EDIT (timestamp updates)
  const updateIncident = async (updatedIncident) => {
    await fetch(`http://127.0.0.1:5000/incidents/${updatedIncident.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedIncident)
    });

    await loadData();
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

      {/* 🌗 Theme Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Shift Log System</h2>

        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

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
