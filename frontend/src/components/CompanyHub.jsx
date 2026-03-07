import React, { useState, useEffect } from "react";

const CompanyHub = ({ companies, setCompanies, API_URL, user }) => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompData, setNewCompData] = useState({ name: "", group: "Standalone" });

  // Restored all your original fields
  const [formData, setFormData] = useState({
    group_name: "",
    website: "",
    chat_links: [""],
    general_info: "",
    promotions: [{ name: "", desc: "" }],
    cashout_schedule: "",
    cashout_rules: ""
  });

  // 1. Logic to extract unique groups for the dropdown
  const groups = ["Standalone", ...new Set(companies.map(c => c.group_name).filter(g => g && g !== ""))];

  // 2. Logic to group companies for the Sidebar display
  const groupedCompanies = companies.reduce((acc, c) => {
    const g = c.group_name || "Standalone";
    if (!acc[g]) acc[g] = [];
    acc[g].push(c);
    return acc;
  }, {});

  useEffect(() => {
    if (selectedCompany) {
      const comp = companies.find(c => c.name === selectedCompany);
      if (comp) {
        let info = {};
        try { 
          info = typeof comp.information === "string" ? JSON.parse(comp.information) : (comp.information || {});
        } catch (e) { info = {}; }

        // Setting all detailed fields back into state
        setFormData({
          group_name: comp.group_name || "Standalone",
          website: info.website || "",
          chat_links: info.chat_links || [""],
          general_info: info.general_info || "",
          promotions: info.promotions || [{ name: "", desc: "" }],
          cashout_schedule: info.cashout_schedule || "",
          cashout_rules: info.cashout_rules || ""
        });
      }
    }
  }, [selectedCompany, companies]);

  const handleCreateCompany = async () => {
    if (!newCompData.name) return alert("Name is required");
    
    let finalGroup = newCompData.group;
    if (finalGroup === "Standalone") finalGroup = "";
    if (finalGroup === "NEW_GROUP") {
        const custom = prompt("Enter new group name:");
        if (!custom) return;
        finalGroup = custom;
    }

    const res = await fetch(`${API_URL}/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Username": user.username },
      body: JSON.stringify({ name: newCompData.name, group_name: finalGroup })
    });

    if (res.ok) {
      const updated = await fetch(`${API_URL}/companies`).then(r => r.json());
      setCompanies(updated);
      setShowAddModal(false);
      setNewCompData({ name: "", group: "Standalone" });
    }
  };

  const handleSave = async () => {
    const res = await fetch(`${API_URL}/companies/${encodeURIComponent(selectedCompany)}/info`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
      body: JSON.stringify({
        group_name: formData.group_name === "Standalone" ? "" : formData.group_name,
        information: JSON.stringify(formData) // Saves all detail fields as JSON
      })
    });
    if (res.ok) {
      const updated = await fetch(`${API_URL}/companies`).then(r => r.json());
      setCompanies(updated);
      setIsEditing(false);
      alert("Company Profile Updated!");
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", height: "85vh" }}>
      {/* SIDEBAR */}
      <div className="glass-card" style={{ width: "280px", padding: "15px", overflowY: "auto" }}>
        <button onClick={() => setShowAddModal(true)} style={{ width: "100%", marginBottom: "15px", background: "var(--primary)" }}>
          + Add New Company
        </button>
        
        <input type="text" placeholder="Search..." onChange={e => setSearchTerm(e.target.value)} style={{ width: "92%", marginBottom: "15px", padding: "8px" }} />

        {Object.keys(groupedCompanies).sort().map(group => (
          <div key={group} style={{ marginBottom: "20px" }}>
            <h5 style={{ color: "var(--primary)", borderBottom: "1px solid #444", paddingBottom: "5px" }}>
              {group.toUpperCase()}
            </h5>
            {groupedCompanies[group]
              .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <div key={c.name} onClick={() => setSelectedCompany(c.name)} 
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "5px", background: selectedCompany === c.name ? "rgba(255,255,255,0.1)" : "transparent" }}>
                  🏢 {c.name}
                </div>
            ))}
          </div>
        ))}
      </div>

      {/* MAIN VIEW */}
      <div className="glass-card" style={{ flex: 1, padding: "25px", overflowY: "auto" }}>
        {showAddModal ? (
          <div className="modal-content">
            <h3>Create New Company</h3>
            <label>Company Name</label>
            <input type="text" value={newCompData.name} onChange={e => setNewCompData({...newCompData, name: e.target.value})} />
            <label>Group</label>
            <select value={newCompData.group} onChange={e => setNewCompData({...newCompData, group: e.target.value})}>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="NEW_GROUP">+ Create New Group</option>
            </select>
            <div style={{ marginTop: "15px" }}>
              <button onClick={handleCreateCompany}>Save</button>
              <button onClick={() => setShowAddModal(false)} style={{ marginLeft: "10px" }}>Cancel</button>
            </div>
          </div>
        ) : selectedCompany ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>{selectedCompany}</h2>
              {user.role !== "operator" && <button onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit Profile"}</button>}
            </div>

            {isEditing ? (
              <div className="hub-form" style={{ marginTop: "20px" }}>
                <label>Change Group</label>
                <select value={formData.group_name} onChange={e => setFormData({...formData, group_name: e.target.value})}>
                   {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <label>Website</label>
                <input type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                <label>Cashout Rules</label>
                <textarea value={formData.cashout_rules} onChange={e => setFormData({...formData, cashout_rules: e.target.value})} />
                <label>General Info</label>
                <textarea value={formData.general_info} onChange={e => setFormData({...formData, general_info: e.target.value})} />
                <button onClick={handleSave} style={{ marginTop: "20px" }}>Save All Changes</button>
              </div>
            ) : (
              <div className="hub-display" style={{ marginTop: "20px" }}>
                <p><strong>Group:</strong> {formData.group_name}</p>
                <p><strong>Website:</strong> <a href={formData.website} target="_blank" rel="noreferrer">{formData.website}</a></p>
                <hr />
                <h4>Cashout Rules</h4>
                <p>{formData.cashout_rules || "No rules defined."}</p>
                <h4>General Info</h4>
                <p>{formData.general_info || "No info."}</p>
              </div>
            )}
          </div>
        ) : <p>Select a company to view its full profile.</p>}
      </div>
    </div>
  );
};

export default CompanyHub;