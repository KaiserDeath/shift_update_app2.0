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
      setIncidents(await incRes.json());
      setCompanies(await compRes.json());
      setCategories(await catRes.json());
    } catch (error) { console.error("Error loading data:", error); }
  };

  const addLog = (action, incident) => {
    const newLog = {
      id: Date.now(),
      action,
      title: incident.company + ": " + (incident.description?.substring(0, 30) || "No desc"),
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

  /* =========================================
     FIXED: Removed window.prompt notification
     Now accepts resolutionText from IncidentRow
     ========================================= */
  const updateStatus = async (id, newStatus, resolutionText = "") => {
    // Logic: If status is Resolved, resolutionText will be provided by our custom modal.
    // If it's empty but status is Resolved, we use a fallback to keep logic intact.
    const finalResolution = newStatus === "Resolved" && !resolutionText 
      ? "Resolved without specific notes." 
      : resolutionText;

    try {
      const response = await fetch(`${API_URL}/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
        body: JSON.stringify({ 
            status: newStatus, 
            resolution: finalResolution 
        }),
      });

      if (response.ok) {
        setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, resolution: finalResolution } : i));
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
    const finalData = { ...updatedIncident, operator: user.username };
    const res = await fetch(`${API_URL}/incidents/${updatedIncident.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
      body: JSON.stringify(finalData),
    });
    if (res.ok) {
      addLog("EDITED", finalData);
      await loadData();
      setEditingIncident(null);
    }
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
            <IncidentForm onAdd={addIncident} onUpdate={updateIncident} editingIncident={editingIncident} companies={companies} setCompanies={setCompanies} categories={categories} setCategories={setCategories} operator={user.username} role={user.role} API_URL={API_URL} />
            
            <div className="filter-bar">
              <select value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
        {activeTab === "hub" && <CompanyHub companies={companies} setCompanies={setCompanies} API_URL={API_URL} user={user} />}
        {activeTab === "analytics" && <Analytics incidents={incidents} />}
        {activeTab === "users" && user.role === "admin" && <div className="view-fade-in"><AdminPanel user={user} /></div>}

        <button className="log-floating-btn" onClick={() => setIsLogOpen(true)}>
          📜 Activity {activityLog.length > 0 && <span className="log-count">{activityLog.length}</span>}
        </button>

        <div className={`activity-drawer ${isLogOpen ? "open" : ""}`}>
          <div className="drawer-header">
            <h3>Recent Activity</h3>
            <button className="close-drawer" onClick={() => setIsLogOpen(false)}>✕</button>
          </div>
          <div className="drawer-body">
            {activityLog.length === 0 ? (
              <p className="empty-log">No history in this session.</p>
            ) : (
              activityLog.map((log) => (
                <div key={log.id} className="log-entry">
                  <div className="log-row">
                    <span className={`log-action-tag ${log.action.toLowerCase()}`}>{log.action}</span>
                    <span className="log-time">{log.time}</span>
                  </div>
                  <p className="log-desc">{log.title}</p>
                  <small className="log-op">Operator: {log.operator}</small>
                </div>
              ))
            )}
          </div>
        </div>
        {isLogOpen && <div className="drawer-overlay" onClick={() => setIsLogOpen(false)}></div>}
      </main>
    </div>
  );
}
export default App;