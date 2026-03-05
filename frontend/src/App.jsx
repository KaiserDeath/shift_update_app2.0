import React, { useEffect, useState } from "react";
import IncidentForm from "./components/IncidentForm";
import IncidentTable from "./components/IncidentTable";
import ImportantTable from "./components/ImportantTable";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import Analytics from "./components/Analytics"; // ✅ New Analytics Import

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function App() {
  const [incidents, setIncidents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIncident, setEditingIncident] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // ✅ State for Tabs
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [filters, setFilters] = useState({
    company: "",
    category: "",
    search: "",
    date_from: "",
    date_to: "",
  });

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  // 🌗 DARK MODE EFFECT (Kept from original)
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ✅ DATA LOADING EFFECT (Kept from original)
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

      const headers = { Role: user.role, Username: user.username };

      const [incRes, compRes, catRes] = await Promise.all([
        fetch(`${API_URL}/incidents?${query}`, { headers }),
        fetch(`${API_URL}/companies`, { headers }),
        fetch(`${API_URL}/categories`, { headers })
      ]);

      setIncidents(await incRes.json());
      setCompanies(await compRes.json());
      setCategories(await catRes.json());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // --- ORIGINAL CRUD LOGIC (UNTOUCHED) ---
  const addIncident = async (incident) => {
    try {
      const response = await fetch(`${API_URL}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
        body: JSON.stringify(incident),
      });
      if (!response.ok) return alert("Error creating incident");
      const createdIncident = await response.json();
      setIncidents(prev => [createdIncident, ...prev]);
      loadData();
    } catch (error) { console.error(error); alert("Server error"); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
        body: JSON.stringify({ status: newStatus }),
      });
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    } catch (error) { console.error(error); }
  };

  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident?")) return;
    await fetch(`${API_URL}/incidents/${id}`, {
      method: "DELETE",
      headers: { Role: user.role, Username: user.username },
    });
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  const updateIncident = async (updatedIncident) => {
    await fetch(`${API_URL}/incidents/${updatedIncident.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
      body: JSON.stringify(updatedIncident),
    });
    await loadData();
    setEditingIncident(null);
  };

  if (!user) return <Login onLogin={(data) => { setUser(data); localStorage.setItem("user", JSON.stringify(data)); }} />;

  return (
    <div className="dashboard-container">
      {/* 🛠 SIDEBAR NAV */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>ShiftLog</h2>
          <p>{user.username} <small>({user.role})</small></p>
        </div>
        
        <ul className="nav-links">
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>📋 Incidents</li>
          <li className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>📊 Analytics</li>
          {user.role === "admin" && (
            <li className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>👥 Users</li>
          )}
        </ul>

        <div className="sidebar-footer">
          <button onClick={() => setDarkMode(!darkMode)} className="mode-toggle">
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={() => { setUser(null); localStorage.removeItem("user"); }} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* 🖥 MAIN CONTENT AREA */}
      <main className="main-content">
        {activeTab === "dashboard" && (
          <div className="view-fade-in">
            <header className="content-header">
              <h2>Incident Management</h2>
            </header>

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

            {/* FILTER BAR (Improved styling class) */}
            <div className="filter-bar">
              <select value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <input type="text" placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
              <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
            </div>

            <ImportantTable incidents={incidents.filter(i => i.status === "Important")} onStatusChange={updateStatus} onDelete={deleteIncident} onEdit={setEditingIncident} />
            <IncidentTable incidents={incidents.filter(i => i.status === "Pending")} variant="pending" onStatusChange={updateStatus} onDelete={deleteIncident} onEdit={setEditingIncident} />
            <IncidentTable incidents={incidents.filter(i => i.status === "Resolved")} variant="resolved" onStatusChange={updateStatus} onDelete={deleteIncident} onEdit={setEditingIncident} />
          </div>
        )}

        {activeTab === "analytics" && <Analytics incidents={incidents} />}
        
        {activeTab === "users" && user.role === "admin" && (
          <div className="view-fade-in">
             <AdminPanel user={user} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;