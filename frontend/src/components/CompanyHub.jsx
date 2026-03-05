import React, { useState, useEffect } from "react";

const CompanyHub = ({ companies, setCompanies, API_URL, user }) => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- STRUCTURED DATA STATE ---
  const [formData, setFormData] = useState({
    group_name: "",
    website: "",
    chat_links: [""],
    general_info: "",
    promotions: [{ name: "", desc: "" }],
    cashout_schedule: "",
    cashout_rules: ""
  });

  // Handle Dynamic Chat Links
  const addChatLink = () => setFormData({ ...formData, chat_links: [...formData.chat_links, ""] });
  const updateChatLink = (index, val) => {
    const newLinks = [...formData.chat_links];
    newLinks[index] = val;
    setFormData({ ...formData, chat_links: newLinks });
  };

  // Handle Dynamic Promotions
  const addPromo = () => setFormData({ ...formData, promotions: [...formData.promotions, { name: "", desc: "" }] });

  const handleSave = async () => {
    await fetch(`${API_URL}/companies/${encodeURIComponent(selectedCompany)}/info`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
      body: JSON.stringify({
        group_name: formData.group_name,
        information: JSON.stringify(formData) // Save the rest as JSON
      })
    });
    setIsEditing(false);
    alert("Saved successfully!");
  };

  // Organize companies by Group for the sidebar display
  const groupedCompanies = companies.reduce((acc, company) => {
    // Note: You'll need to fetch the 'group_name' from the backend for this to be 100% accurate
    const group = "Standalone"; 
    if (!acc[group]) acc[group] = [];
    acc[group].push(company);
    return acc;
  }, {});

  return (
    <div className="view-fade-in" style={{ display: "flex", gap: "20px" }}>
      {/* SIDEBAR: Grouped List */}
      <div className="glass-card" style={{ width: "300px", padding: "20px", height: "80vh", overflowY: "auto" }}>
        <input 
          type="text" placeholder="Search..." 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", marginBottom: "20px" }}
        />
        {Object.keys(groupedCompanies).map(group => (
          <div key={group} style={{ marginBottom: "15px" }}>
            <h5 style={{ color: "var(--primary)", fontSize: "12px", textTransform: "uppercase" }}>{group}</h5>
            {groupedCompanies[group].map(name => (
              <div 
                key={name} 
                onClick={() => setSelectedCompany(name)}
                className={`nav-link-item ${selectedCompany === name ? "active" : ""}`}
                style={{ cursor: "pointer", padding: "8px", borderRadius: "8px" }}
              >
                🏢 {name}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT: The Form/Display */}
      <div className="glass-card" style={{ flex: 1, padding: "30px", overflowY: "auto", height: "80vh" }}>
        {selectedCompany ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2>{selectedCompany}</h2>
              {user.role !== "operator" && (
                <button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="hub-form" style={{ marginTop: "20px" }}>
                <label>Group Name (Sub-category)</label>
                <input type="text" value={formData.group_name} onChange={(e) => setFormData({...formData, group_name: e.target.value})} style={{width: "100%"}} />

                <label>Website Link</label>
                <input type="text" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} style={{width: "100%"}} />

                <label>Chat Channels</label>
                {formData.chat_links.map((link, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                    <input type="text" value={link} onChange={(e) => updateChatLink(i, e.target.value)} style={{flex: 1}} />
                    {i === formData.chat_links.length - 1 && <button onClick={addChatLink}>+</button>}
                  </div>
                ))}

                <label>General Information</label>
                <textarea value={formData.general_info} onChange={(e) => setFormData({...formData, general_info: e.target.value})} style={{width: "100%", height: "100px"}} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                  <div>
                    <h4>Promotions</h4>
                    {formData.promotions.map((p, i) => (
                       <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                          <input placeholder="Bonus Name" value={p.name} onChange={(e) => {
                            const newP = [...formData.promotions]; newP[i].name = e.target.value; setFormData({...formData, promotions: newP});
                          }} style={{width: "100%", marginBottom: "5px"}} />
                          <textarea placeholder="Description" value={p.desc} onChange={(e) => {
                            const newP = [...formData.promotions]; newP[i].desc = e.target.value; setFormData({...formData, promotions: newP});
                          }} style={{width: "100%"}} />
                       </div>
                    ))}
                    <button onClick={addPromo}>+ Add Promotion</button>
                  </div>

                  <div>
                    <h4>Cashouts</h4>
                    <input placeholder="Schedule" value={formData.cashout_schedule} onChange={(e) => setFormData({...formData, cashout_schedule: e.target.value})} style={{width: "100%", marginBottom: "10px"}} />
                    <textarea placeholder="Rules" value={formData.cashout_rules} onChange={(e) => setFormData({...formData, cashout_rules: e.target.value})} style={{width: "100%"}} />
                  </div>
                </div>

                <button onClick={handleSave} style={{ marginTop: "30px", width: "100%", padding: "15px" }}>Save All Changes</button>
              </div>
            ) : (
              <div className="hub-display" style={{ marginTop: "20px" }}>
                {/* DISPLAY VIEW: Show links as clickable <a> tags, use labels, etc. */}
                <p><strong>Website:</strong> <a href={formData.website} target="_blank">{formData.website}</a></p>
                <p><strong>Group:</strong> {formData.group_name || "Standalone"}</p>
                {/* ... Render the rest of the display UI here ... */}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "100px" }}>Select a company to view the Hub.</div>
        )}
      </div>
    </div>
  );
};

export default CompanyHub;