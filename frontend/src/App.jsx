import React, { useEffect, useState } from "react";
import IncidentForm from "./components/IncidentForm";
import IncidentTable from "./components/IncidentTable";
import ImportantTable from "./components/ImportantTable";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel"; // ✅ Admin panel import

function App() {
  const [incidents, setIncidents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIncident, setEditingIncident] = useState(null);
  const [user, setUser] = useState(() => {
    // Persistent login: load user from localStorage if exists
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [filters, setFilters] = useState({
    company: "",
    category: "",
    search: "",
    date_from: "",
    date_to: ""
  });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // 🌗 DARK MODE EFFECT
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ✅ DATA LOADING EFFECT
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [filters, user]);

  const loadData = async (activeFilters = filters) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v)
      );
      const query = new URLSearchParams(cleanFilters).toString();

      // INCIDENTS
      const incidentsRes = await fetch(`http://127.0.0.1:5000/incidents?${query}`, {
        headers: {
          "Role": user.role,
          "Username": user.username
        }
      });
      const incidentsData = await incidentsRes.json();
      setIncidents(incidentsData);

      // COMPANIES
      const companiesRes = await fetch("http://127.0.0.1:5000/companies", {
        headers: {
          "Role": user.role,
          "Username": user.username
        }
      });
      const companiesData = await companiesRes.json();
      setCompanies(companiesData);

      // CATEGORIES
      const categoriesRes = await fetch("http://127.0.0.1:5000/categories", {
        headers: {
          "Role": user.role,
          "Username": user.username
        }
      });
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addIncident = async (incident) => {
    await fetch("http://127.0.0.1:5000/incidents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Role": user.role,
        "Username": user.username
      },
      body: JSON.stringify(incident)
    });
    await loadData();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`http://127.0.0.1:5000/incidents/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Role": user.role,
          "Username": user.username
        },
        body: JSON.stringify({ status: newStatus })
      });

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

  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident?")) return;

    await fetch(`http://127.0.0.1:5000/incidents/${id}`, {
      method: "DELETE",
      headers: {
        "Role": user.role,
        "Username": user.username
      }
    });

    setIncidents(prev =>
      prev.filter(incident => incident.id !== id)
    );
  };

  const updateIncident = async (updatedIncident) => {
    await fetch(`http://127.0.0.1:5000/incidents/${updatedIncident.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Role": user.role,
        "Username": user.username
      },
      body: JSON.stringify(updatedIncident)
    });

    await loadData();
    setEditingIncident(null);
  };

  // ✅ LOGIN BLOCK
  if (!user) return <Login onLogin={(data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data)); // save user for persistent login
  }} />;

  // 🔴 Important
  const importantIncidents = incidents.filter(i => i.status === "Important");

  // 🟡 Pending
  const pendingIncidents = incidents.filter(i => i.status === "Pending");

  // 🟢 Resolved
  const resolvedIncidents = incidents.filter(i => i.status === "Resolved");

  return (
    <div style={{ padding: "20px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Shift Log System</h2>

        <div>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>

          <button
            onClick={() => {
              setUser(null);                  // clear React state
              localStorage.removeItem("user"); // clear persistent login
            }}
            style={{ marginLeft: "10px" }}
          >
            Logout ({user.username})
          </button>
        </div>
      </div>

      {/* ✅ ADMIN PANEL (ONLY FOR ADMINS) */}
      {user.role === "admin" && <AdminPanel user={user} />}

      <IncidentForm
        onAdd={addIncident}
        onUpdate={updateIncident}
        editingIncident={editingIncident}
        companies={companies}
        setCompanies={setCompanies}
        categories={categories}
        setCategories={setCategories}
        operator={user.username}
        role={user.role}
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
        incidents={pendingIncidents}
        variant="pending"
        onStatusChange={updateStatus}
        onDelete={deleteIncident}
        onEdit={setEditingIncident}
      />

      <IncidentTable
        incidents={resolvedIncidents}
        variant="resolved"
        onStatusChange={updateStatus}
        onDelete={deleteIncident}
        onEdit={setEditingIncident}
      />

    </div>
  );
}

export default App;