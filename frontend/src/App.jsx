import React, { useEffect, useState } from "react";
import IncidentForm from "./components/IncidentForm";
import IncidentTable from "./components/IncidentTable";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import Analytics from "./components/Analytics";
import CompanyHub from "./components/CompanyHub";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function App() {
  const [incidents, setIncidents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIncident, setEditingIncident] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activityLog, setActivityLog] = useState([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [filters, setFilters] = useState({ company: "", category: "", search: "", date_from: "", date_to: "" });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (user) loadData();
  }, [filters, user]);

  const loadData = async (activeFilters = filters) => {
    try {
      const cleanFilters = Object.fromEntries(Object.entries(activeFilters).filter(([_, v]) => v));
      const query = new URLSearchParams(cleanFilters).toString();
      const headers = { Role: user.role, Username: user.username };

      const [incRes, compRes, catRes] = await Promise.all([
        fetch(`${API_URL}/incidents?${query}`, { headers }),
        fetch(`${API_URL}/companies`, { headers }),
        fetch(`${API_URL}/categories`, { headers })
      ]);

      let rawIncidents = await incRes.json();
      let rawCategories = await catRes.json();

      // Normalize all categories into objects { name, private }
      const normalizedCategories = rawCategories.map(c =>
        typeof c === "string" ? { name: c, private: false } : { name: c.name, private: c.private ?? false }
      );

      if (user.role === "operator") {
        // 1. Identify which categories are allowed (NOT private)
        const allowedCategories = normalizedCategories.filter(c => !c.private);
        const allowedNames = allowedCategories.map(c => c.name);

        // 2. Filter incidents: Only show incidents whose category is in the allowed list
        setIncidents(rawIncidents.filter(i => allowedNames.includes(i.category)));

        // 3. Filter categories state: Operators will NEVER see private categories in dropdowns/filters
        setCategories(allowedCategories);
      } else {
        // Admin/Supervisor see everything
        setIncidents(rawIncidents);
        setCategories(normalizedCategories);
      }

      setCompanies(await compRes.json());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addLog = (action, incident) => {
    const newLog = {
      id: Date.now(),
      action,
      title: (incident.company || "Unknown") + ": " + (incident.description?.substring(0, 30) || "No desc"),
      operator: user.username,
      time: new Date().toLocaleTimeString()
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 20));
  };

  const addIncident = async (incident) => {
    try {
      const response = await fetch(`${API_URL}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
        body: JSON.stringify(incident),
      });
      if (response.ok) {
        const created = await response.json();
        setIncidents(prev => [created, ...prev]);
        addLog("CREATED", created);
        loadData();
      }
    } catch (error) { console.error(error); }
  };

  const updateStatus = async (id, newStatus, resolutionText = "") => {
    const finalResolution = newStatus === "Resolved" && !resolutionText
      ? "Resolved without specific notes."
      : resolutionText;

    try {
      const response = await fetch(`${API_URL}/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
        body: JSON.stringify({ status: newStatus, resolution: finalResolution }),
      });

      if (response.ok) {
        await loadData();
        const target = incidents.find(i => i.id === id);
        if (target) addLog(newStatus.toUpperCase(), target);
      }
    } catch (error) { console.error(error); }
  };

  const deleteIncident = async (id) => {
    const target = incidents.find(i => i.id === id);
    if (!window.confirm("Delete this incident?")) return;
    const res = await fetch(`${API_URL}/incidents/${id}`, {
      method: "DELETE",
      headers: { Role: user.role, Username: user.username },
    });
    if (res.ok) {
      addLog("DELETED", target);
      setIncidents(prev => prev.filter(i => i.id !== id));
    }
  };

  const updateIncident = async (updatedIncident) => {
    try {
      const res = await fetch(`${API_URL}/incidents/${updatedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
        body: JSON.stringify({ ...updatedIncident, operator: user.username }),
      });
      if (res.ok) {
        addLog("EDITED", updatedIncident);
        await loadData();
        setEditingIncident(null);
      }
    } catch (error) { console.error(error); }
  };

  if (!user) return <Login onLogin={(data) => { setUser(data); localStorage.setItem("user", JSON.stringify(data)); }} />;

  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>ShiftLog</h2>
          <p>{user.username} <small>({user.role})</small></p>
        </div>
        <ul className="nav-links">
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>📋 Incidents</li>
          <li className={activeTab === "hub" ? "active" : ""} onClick={() => setActiveTab("hub")}>🏢 Company Hub</li>
          <li className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>📊 Analytics</li>
          {user.role === "admin" && <li className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>👥 Users</li>}
        </ul>
        <div className="sidebar-footer">
          <button onClick={() => setDarkMode(!darkMode)} className="mode-toggle">{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
          <button onClick={() => { setUser(null); localStorage.removeItem("user"); }} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === "dashboard" && (
          <div className="view-fade-in">
            <header className="content-header"><h2>Incident Management</h2></header>

            {editingIncident && (
              <div className="modal-overlay">
                <div className="modal-content glass-effect">
                  <button className="close-modal" onClick={() => setEditingIncident(null)}>✕</button>
                  <h3 style={{ marginBottom: '20px' }}>Edit Incident</h3>
                  <IncidentForm
                    onAdd={addIncident}
                    onUpdate={updateIncident}
                    editingIncident={editingIncident}
                    companies={companies}
                    categories={categories}
                    setCategories={setCategories}
                    operator={user.username}
                    role={user.role}
                    API_URL={API_URL}
                  />
                </div>
              </div>
            )}

            {!editingIncident && (
              <IncidentForm
                onAdd={addIncident}
                onUpdate={updateIncident}
                editingIncident={null}
                companies={companies}
                categories={categories}
                setCategories={setCategories}
                operator={user.username}
                role={user.role}
                API_URL={API_URL}
              />
            )}

            <div className="filter-bar">
              <select value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {/* Because we filtered 'categories' in loadData, 
                   this will only show public options to Operators 
                */}
                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
              <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
            </div>

            <IncidentTable variant="important" incidents={incidents.filter(i => i.status === "Important")} onStatusChange={updateStatus} onDelete={deleteIncident} onEdit={setEditingIncident} />
            <IncidentTable variant="pending" incidents={incidents.filter(i => i.status === "Pending")} onStatusChange={updateStatus} onDelete={deleteIncident} onEdit={setEditingIncident} />
            <IncidentTable variant="resolved" incidents={incidents.filter(i => i.status === "Resolved")} onStatusChange={updateStatus} onDelete={deleteIncident} onEdit={setEditingIncident} />
          </div>
        )}

        {activeTab === "hub" && (
          <CompanyHub
            companies={companies}
            setCompanies={setCompanies}
            categories={categories}
            setCategories={setCategories}
            API_URL={API_URL}
            user={user}
            refreshData={loadData}
          />
        )}

        {activeTab === "analytics" && <Analytics incidents={incidents} />}
        {activeTab === "users" && user.role === "admin" && <div className="view-fade-in"><AdminPanel user={user} /></div>}

        <button className="log-floating-btn" onClick={() => setIsLogOpen(true)}>
          📜 Activity {activityLog.length > 0 && <span className="log-count">{activityLog.length}</span>}
        </button>

        <div className={`activity-drawer ${isLogOpen ? "open" : ""}`}>
          <div className="drawer-header"><h3>Recent Activity</h3><button className="close-drawer" onClick={() => setIsLogOpen(false)}>✕</button></div>
          <div className="drawer-body">
            {activityLog.length === 0 ? <p className="empty-log">No history in this session.</p> : activityLog.map((log) => (
              <div key={log.id} className="log-entry">
                <div className="log-row">
                  <span className={`log-action-tag ${log.action.toLowerCase()}`}>{log.action}</span>
                  <span className="log-time">{log.time}</span>
                </div>
                <p className="log-desc">{log.title}</p>
                <small className="log-op">Operator: {log.operator}</small>
              </div>
            ))}
          </div>
        </div>
        {isLogOpen && <div className="drawer-overlay" onClick={() => setIsLogOpen(false)}></div>}
      </main>
    </div>
  );
}

export default App;