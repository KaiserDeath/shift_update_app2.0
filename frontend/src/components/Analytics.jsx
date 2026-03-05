import React, { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from "recharts";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#ca8a04"];

const Analytics = ({ incidents }) => {
  // Calculate top-level stats
  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === "Resolved").length;
    const pending = incidents.filter(i => i.status === "Pending").length;
    const important = incidents.filter(i => i.status === "Important").length;
    return { total, resolved, pending, important };
  }, [incidents]);

  // Data for Bar Chart: Incidents by Company
  const companyData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => {
      counts[i.company] = (counts[i.company] || 0) + 1;
    });
    return Object.keys(counts)
      .map(name => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  // Data for Pie Chart: Category Distribution
  const categoryData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [incidents]);

  return (
    <div className="view-fade-in">
      <h2 style={{ marginBottom: "20px" }}>Operational Analytics</h2>

      {/* QUICK STATS RIBBON */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div className="glass-card" style={{ padding: "15px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "12px" }}>TOTAL</p>
          <h1 style={{ color: "var(--primary)" }}>{stats.total}</h1>
        </div>
        <div className="glass-card" style={{ padding: "15px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "12px" }}>IMPORTANT</p>
          <h1 style={{ color: "var(--status-important)" }}>{stats.important}</h1>
        </div>
        <div className="glass-card" style={{ padding: "15px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "12px" }}>PENDING</p>
          <h1 style={{ color: "var(--status-progress)" }}>{stats.pending}</h1>
        </div>
        <div className="glass-card" style={{ padding: "15px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "12px" }}>RESOLVED</p>
          <h1 style={{ color: "var(--status-closed)" }}>{stats.resolved}</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
        {/* BAR CHART: COMPANY ACTIVITY */}
        <div className="glass-card" style={{ padding: "20px", height: "400px" }}>
          <h3 style={{ marginBottom: "15px" }}>Incidents by Company</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={companyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} />
              <YAxis stroke="var(--muted)" fontSize={11} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: "var(--glass-strong)", borderRadius: "10px", border: "1px solid var(--glass-border)", color: "var(--text)" }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART: CATEGORY DISTRIBUTION */}
        <div className="glass-card" style={{ padding: "20px", height: "400px" }}>
          <h3 style={{ marginBottom: "15px" }}>Issue Categories</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;