import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import Popup from "./Popup";

// --- MEMOIZED SIDEBAR COMPONENT ---
const Sidebar = memo(({ companies, selectedCompany, setSelectedCompany, isAdmin, setShowQuickAdd, favorites, toggleFavorite }) => {
  const [localSearch, setLocalSearch] = useState("");

  const displayList = useMemo(() => {
    return companies
      .filter(c => c.name.toLowerCase().includes(localSearch.toLowerCase()))
      .sort((a, b) => {
        const aFav = favorites.includes(a.name);
        const bFav = favorites.includes(b.name);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [companies, localSearch, favorites]);

  return (
    <div className="sidebar">
      {isAdmin && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button onClick={() => setShowQuickAdd("company")} style={{ flex: 1, fontSize: "11px" }}>+ Company</button>
          <button onClick={() => setShowQuickAdd("group")} style={{ flex: 1, fontSize: "11px", background: "var(--glass-strong)" }}>+ Group</button>
        </div>
      )}
      <input 
        type="text" 
        placeholder="Search companies..." 
        value={localSearch}
        onChange={e => setLocalSearch(e.target.value)} 
        style={{ width: "100%", marginBottom: "20px" }} 
      />
      <div style={{ overflowY: "auto", flexGrow: 1 }}>
        {displayList.map(c => {
          const isFav = favorites.includes(c.name);
          return (
            <div key={c.name} 
              style={{ 
                padding: "12px", borderRadius: "10px", cursor: "pointer", marginBottom: "8px", position: "relative",
                background: selectedCompany === c.name ? "var(--primary)" : "rgba(255,255,255,0.03)", 
                color: selectedCompany === c.name ? "white" : "var(--text)",
                borderLeft: isFav ? "4px solid #ffca28" : "4px solid transparent",
                transition: "all 0.2s ease"
              }}>
              <div onClick={() => setSelectedCompany(c.name)}>
                <div style={{ fontWeight: "bold", paddingRight: "30px" }}>🏢 {c.name}</div>
                {c.group_name && <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "2px" }}>📁 {c.group_name}</div>}
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(c.name); }}
                style={{ 
                  position: "absolute", top: "12px", right: "10px", background: "none", border: "none", 
                  cursor: "pointer", fontSize: "14px", filter: isFav ? "none" : "grayscale(1) opacity(0.3)" 
                }}
              >
                {isFav ? "⭐" : "☆"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// --- MAIN COMPANY HUB COMPONENT ---
const CompanyHub = ({ companies, setCompanies, API_URL, user }) => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [gameSearch, setGameSearch] = useState(""); 
  const [activeModal, setActiveModal] = useState(null);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingGameIndex, setEditingGameIndex] = useState(null);
  const [editingDepositIndex, setEditingDepositIndex] = useState(null);
  const [editingCashoutIndex, setEditingCashoutIndex] = useState(null);
  const [belongsToGroup, setBelongsToGroup] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(null); 
  const [quickName, setQuickName] = useState("");
  const [showLibraryManager, setShowLibraryManager] = useState(false);

  // Popup state
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  const closePopup = () => setPopupState(prev => ({ ...prev, isOpen: false }));

  // --- METHOD LIBRARY STATE ---
  const [methodLibrary, setMethodLibrary] = useState(() => {
    const saved = localStorage.getItem("hub_method_library");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("hub_method_library", JSON.stringify(methodLibrary));
  }, [methodLibrary]);

  const saveToLibrary = (method) => {
    const exists = methodLibrary.find(m => m.label === method.label && m.provider === method.provider);
    if (!exists) {
      setMethodLibrary([...methodLibrary, { ...method }]);
      setPopupState({
        isOpen: true,
        title: "Success",
        message: "Method saved to your global library!",
        type: "alert",
        onConfirm: closePopup
      });
    } else {
      setPopupState({
        isOpen: true,
        title: "Info",
        message: "This method is already in your library.",
        type: "alert",
        onConfirm: closePopup
      });
    }
  };

  const removeFromLibrary = (index) => {
    setPopupState({
      isOpen: true,
      title: "Confirm Removal",
      message: "Remove this template from your library?",
      type: "confirm",
      onConfirm: () => {
        closePopup();
        const updated = methodLibrary.filter((_, idx) => idx !== index);
        setMethodLibrary(updated);
      }
    });
  };

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("hub_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("hub_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((name) => {
    setFavorites(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }, []);

  const [formData, setFormData] = useState({
    group_name: "", website: "", tyc_link: "", 
    game_credentials: [], 
    deposit_methods: [],
    cashout_methods: [], 
    auto_promos: "", manual_promos: "", deposit_info: "", cashout_rules: ""
  });

  const canManage = user.role === "admin" || user.role === "supervisor";

  const existingGroups = useMemo(() => {
    return [...new Set(companies.map(c => c.group_name).filter(g => g && g.trim() !== ""))];
  }, [companies]);

  useEffect(() => {
    if (selectedCompany) {
      const comp = companies.find(c => c.name === selectedCompany);
      if (comp) {
        let info = {};
        try { info = typeof comp.information === "string" ? JSON.parse(comp.information) : (comp.information || {}); } catch (e) {}
        setBelongsToGroup(!!(comp.group_name && comp.group_name.trim() !== ""));
        setFormData({
          group_name: comp.group_name || "",
          website: info.website || "",
          tyc_link: info.tyc_link || "",
          game_credentials: Array.isArray(info.game_credentials) ? info.game_credentials : [],
          deposit_methods: Array.isArray(info.deposit_methods) ? info.deposit_methods : [],
          cashout_methods: Array.isArray(info.cashout_methods) ? info.cashout_methods : [],
          auto_promos: info.auto_promos || "",
          manual_promos: info.manual_promos || "",
          deposit_info: info.deposit_info || "",
          cashout_rules: info.cashout_rules || ""
        });
      }
    }
  }, [selectedCompany, companies]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setPopupState({
      isOpen: true,
      title: "Success",
      message: "Copied to clipboard!",
      type: "alert",
      onConfirm: closePopup
    });
  };

  const handleQuickAdd = async () => {
    if (!canManage || !quickName) return;
    const payload = showQuickAdd === "group" 
      ? { name: `${quickName} (Primary)`, group_name: quickName }
      : { name: quickName, group_name: "" };

    const res = await fetch(`${API_URL}/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setCompanies(await fetch(`${API_URL}/companies`).then(r => r.json()));
      setQuickName("");
      setShowQuickAdd(null);
    }
  };

  const handleSave = async (updatedData = formData) => {
    if (!canManage) return;
    const finalGroup = belongsToGroup ? updatedData.group_name : "";
    const res = await fetch(`${API_URL}/companies/${encodeURIComponent(selectedCompany)}/info`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Role: user.role, Username: user.username },
      body: JSON.stringify({
        group_name: finalGroup,
        information: JSON.stringify({ ...updatedData, group_name: finalGroup })
      })
    });
    if (res.ok) {
      setCompanies(await fetch(`${API_URL}/companies`).then(r => r.json()));
      setIsEditingSection(false);
      setEditingGameIndex(null);
      setEditingDepositIndex(null);
      setEditingCashoutIndex(null);
    }
  };

  const updateGameInline = (index, field, value) => {
    const updated = [...formData.game_credentials];
    updated[index][field] = value;
    setFormData({ ...formData, game_credentials: updated });
  };

  const updateDepositInline = (index, field, value) => {
    const updated = [...formData.deposit_methods];
    updated[index][field] = value;
    setFormData({ ...formData, deposit_methods: updated });
  };

  const updateCashoutInline = (index, field, value) => {
    const updated = [...formData.cashout_methods];
    updated[index][field] = value;
    setFormData({ ...formData, cashout_methods: updated });
  };

  const HubCard = ({ id, title, icon }) => (
    <div className="glass-card view-fade-in" 
      onClick={() => { setActiveModal(id); setIsEditingSection(false); setEditingGameIndex(null); setEditingDepositIndex(null); setEditingCashoutIndex(null); setGameSearch(""); }}
      style={{ padding: "40px 20px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}
    >
      <span style={{ fontSize: "2.5rem" }}>{icon}</span>
      <h3 style={{ margin: 0, color: "var(--text)" }}>{title}</h3>
    </div>
  );

  const handleDeleteCompany = () => {
    setPopupState({
      isOpen: true,
      title: "Confirm Deletion",
      message: `Are you sure you want to delete ${selectedCompany}?`,
      type: "confirm",
      onConfirm: async () => {
        closePopup();
        const res = await fetch(`${API_URL}/companies/${encodeURIComponent(selectedCompany)}`, {
            method: "DELETE",
            headers: { Role: user.role, Username: user.username }
        });
        if (res.ok) {
            setCompanies(await fetch(`${API_URL}/companies`).then(r => r.json()));
            setSelectedCompany(null);
            setActiveModal(null);
        }
      }
    });
  };

  return (
    <div className="dashboard-container" style={{ height: "100%", width: "100%" }}>
      <Sidebar 
        companies={companies}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        isAdmin={canManage}
        setShowQuickAdd={setShowQuickAdd}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
             <button onClick={() => setShowLibraryManager(true)} style={{ fontSize: '11px', background: 'var(--glass-strong)' }}>📋 Manage Templates ({methodLibrary.length})</button>
        </div>
        {selectedCompany ? (
          <div className="view-fade-in">
            <header className="content-header">
              <h2 style={{ fontSize: "28px" }}>{selectedCompany}</h2>
              <p style={{ color: "var(--muted)" }}>{canManage ? "Management View" : "Operator View"}</p>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px" }}>
              <HubCard id="general" title="General Info" icon="🌐" />
              <HubCard id="credentials" title="Credentials" icon="🔑" />
              <HubCard id="auto_promo" title="Auto Promos" icon="🤖" />
              <HubCard id="manual_promo" title="Manual Promos" icon="✍️" />
              <HubCard id="deposits" title="Deposits" icon="💰" />
              <HubCard id="cashouts" title="Cashouts" icon="💸" />
            </div>
          </div>
        ) : <div style={{ textAlign: "center", marginTop: "100px" }}><h2 style={{ color: "var(--muted)" }}>Select a company from the list</h2></div>}
      </div>

      {/* LIBRARY MANAGER MODAL */}
      {showLibraryManager && (
        <div className="view-fade-in" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10002 }}>
             <div className="glass-card" style={{ width: "600px", padding: "30px", maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3>Template Library</h3>
                    <button onClick={() => setShowLibraryManager(false)}>Close</button>
                </div>
                {methodLibrary.length === 0 ? <p style={{ opacity: 0.5 }}>No templates saved yet.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {methodLibrary.map((m, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{m.label}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.7 }}>{m.provider} | Min: {m.min} | Max: {m.max}</div>
                                </div>
                                <button onClick={() => removeFromLibrary(idx)} style={{ background: 'rgba(255,0,0,0.2)', color: '#ff4d4d', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {showQuickAdd && canManage && (
        <div className="view-fade-in" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10001 }}>
          <div className="glass-card" style={{ width: "350px", padding: "30px" }}>
            <h3>Add New {showQuickAdd === "group" ? "Group" : "Company"}</h3>
            <input type="text" placeholder="Name..." value={quickName} onChange={e => setQuickName(e.target.value)} style={{ width: "100%", marginTop: "15px" }} autoFocus />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleQuickAdd} style={{ flex: 1 }}>Create</button>
              <button onClick={() => setShowQuickAdd(null)} style={{ flex: 1, background: "transparent" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION MODAL */}
      {activeModal && (
        <div className="view-fade-in" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setActiveModal(null)}>
          <div className="glass-card" style={{ width: "800px", padding: "40px", position: "relative", background: "var(--glass-strong)", maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
              <h2 style={{ color: "var(--primary)", margin: 0 }}>
                {activeModal === "deposits" ? "DEPOSIT METHODS" : activeModal === "cashouts" ? "CASHOUT METHODS" : activeModal.toUpperCase()}
              </h2>
              {canManage && activeModal !== "credentials" && activeModal !== "deposits" && activeModal !== "cashouts" && (
                <button onClick={() => setIsEditingSection(!isEditingSection)}>{isEditingSection ? "Cancel" : "Edit"}</button>
              )}
            </div>

            <div style={{ minHeight: "250px" }}>
              {activeModal === "credentials" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="text" placeholder="Search games..." value={gameSearch} onChange={e => setGameSearch(e.target.value)} style={{ flex: 1 }} />
                    {canManage && <button onClick={() => {
                        const newGames = [{ game: "New Game", username: "", link: "" }, ...formData.game_credentials];
                        setFormData({ ...formData, game_credentials: newGames });
                        setEditingGameIndex(0);
                    }} style={{ background: "var(--primary)" }}>+ Add New Game</button>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {formData.game_credentials
                      .filter(g => g.game.toLowerCase().includes(gameSearch.toLowerCase()))
                      .map((g, i) => (
                        <div key={i} className="glass-card" style={{ 
                            padding: "15px", 
                            background: editingGameIndex === i ? "rgba(var(--primary-rgb), 0.1)" : "rgba(255,255,255,0.05)",
                            border: editingGameIndex === i ? "1px solid var(--primary)" : "1px solid transparent"
                        }}>
                          {editingGameIndex === i ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px" }}>
                              <input value={g.game} onChange={e => updateGameInline(i, "game", e.target.value)} placeholder="Game Name" style={{ background: "var(--glass-strong)" }} />
                              <input value={g.username} onChange={e => updateGameInline(i, "username", e.target.value)} placeholder="Username" style={{ background: "var(--glass-strong)" }} />
                              <input value={g.link} onChange={e => updateGameInline(i, "link", e.target.value)} placeholder="Access Link" style={{ background: "var(--glass-strong)" }} />
                              <div style={{ display: "flex", gap: "5px" }}>
                                <button onClick={() => handleSave()} style={{ background: "#4caf50", color: "white", padding: "0 15px" }}>Save</button>
                                <button onClick={() => setEditingGameIndex(null)} style={{ background: "rgba(255,255,255,0.1)", padding: "0 10px" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", gap: "20px", flex: 1 }}>
                                <span style={{ fontWeight: "bold", minWidth: "120px" }}>{g.game}</span>
                                <span style={{ opacity: 0.8 }}>👤 {g.username}</span>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => copyToClipboard(g.username)} style={{ fontSize: "11px" }}>Copy User</button>
                                <button onClick={() => copyToClipboard(g.link)} style={{ fontSize: "11px" }}>Copy Link</button>
                                {canManage && (
                                  <>
                                    <button onClick={() => setEditingGameIndex(i)} style={{ fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>Edit</button>
                                    <button onClick={() => {
                                        setPopupState({
                                          isOpen: true,
                                          title: "Confirm Deletion",
                                          message: "Delete this credential?",
                                          type: "confirm",
                                          onConfirm: () => {
                                              closePopup();
                                              const updated = formData.game_credentials.filter((_, idx) => idx !== i);
                                              const newData = { ...formData, game_credentials: updated };
                                              setFormData(newData);
                                              handleSave(newData);
                                          }
                                        });
                                    }} style={{ fontSize: "11px", background: "rgba(255,77,77,0.2)", color: "#ff4d4d" }}>Delete</button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ) : (activeModal === "deposits" || activeModal === "cashouts") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ opacity: 0.7, margin: 0 }}>Available {activeModal} methods.</p>
                    {canManage && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {/* IMPORT FROM LIBRARY DROPDOWN */}
                        {methodLibrary.length > 0 && (
                          <select 
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const selected = methodLibrary[e.target.value];
                              const field = activeModal === "deposits" ? "deposit_methods" : "cashout_methods";
                              const newData = { ...formData, [field]: [{ ...selected }, ...formData[field]] };
                              setFormData(newData);
                              handleSave(newData);
                              e.target.value = "";
                            }}
                            style={{ fontSize: "11px", width: "auto", padding: "8px", background: "var(--glass-strong)", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            <option value="">📋 Import Template...</option>
                            {methodLibrary.map((lib, idx) => (
                              <option key={idx} value={idx}>{lib.label} ({lib.provider})</option>
                            ))}
                          </select>
                        )}
                        <button onClick={() => {
                          const field = activeModal === "deposits" ? "deposit_methods" : "cashout_methods";
                          const newMethods = [{ label: "NEW METHOD", provider: "", min: "", max: "" }, ...formData[field]];
                          setFormData({ ...formData, [field]: newMethods });
                          activeModal === "deposits" ? setEditingDepositIndex(0) : setEditingCashoutIndex(0);
                        }} style={{ background: "var(--primary)" }}>+ Add New</button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {(activeModal === "deposits" ? formData.deposit_methods : formData.cashout_methods).map((m, i) => {
                      const isEditing = activeModal === "deposits" ? editingDepositIndex === i : editingCashoutIndex === i;
                      return (
                        <div key={i} className="glass-card" style={{ 
                          padding: "20px", 
                          background: isEditing ? "rgba(var(--primary-rgb), 0.1)" : "rgba(255,255,255,0.05)",
                          border: isEditing ? "1px solid var(--primary)" : "1px solid transparent"
                        }}>
                          {isEditing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              <input 
                                value={m.label} 
                                onChange={e => activeModal === "deposits" ? updateDepositInline(i, "label", e.target.value.toUpperCase()) : updateCashoutInline(i, "label", e.target.value.toUpperCase())} 
                                placeholder="NAME (E.G. BANK TRANSFER)" 
                                style={{ background: "var(--glass-strong)", fontWeight: "bold" }} 
                              />
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px" }}>
                                <input value={m.provider} onChange={e => activeModal === "deposits" ? updateDepositInline(i, "provider", e.target.value) : updateCashoutInline(i, "provider", e.target.value)} placeholder="Provider" style={{ background: "var(--glass-strong)" }} />
                                <input value={m.min} onChange={e => activeModal === "deposits" ? updateDepositInline(i, "min", e.target.value) : updateCashoutInline(i, "min", e.target.value)} placeholder="Min" style={{ background: "var(--glass-strong)" }} />
                                <input value={m.max} onChange={e => activeModal === "deposits" ? updateDepositInline(i, "max", e.target.value) : updateCashoutInline(i, "max", e.target.value)} placeholder="Max" style={{ background: "var(--glass-strong)" }} />
                                <div style={{ display: "flex", gap: "5px" }}>
                                  <button onClick={() => handleSave()} style={{ background: "#4caf50", color: "white" }}>Save</button>
                                  <button onClick={() => activeModal === "deposits" ? setEditingDepositIndex(null) : setEditingCashoutIndex(null)} style={{ background: "rgba(255,255,255,0.1)" }}>✕</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                <div style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "14px", color: "var(--primary)", letterSpacing: "1px" }}>
                                  {m.label || "METHOD NAME"}
                                </div>
                                {canManage && (
                                    <button 
                                      onClick={() => saveToLibrary(m)}
                                      style={{ fontSize: "10px", padding: "4px 8px", background: "var(--glass-strong)", border: "1px solid var(--primary)", color: "var(--primary)" }}
                                    >
                                      💾 Save as Template
                                    </button>
                                )}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "20px", flex: 1 }}>
                                  <span><strong>Provider:</strong> {m.provider}</span>
                                  <span><strong>Min Amount:</strong> {m.min}</span>
                                  <span><strong>Max Amount:</strong> {m.max}</span>
                                </div>
                                {canManage && (
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => activeModal === "deposits" ? setEditingDepositIndex(i) : setEditingCashoutIndex(i)} style={{ fontSize: "11px" }}>Edit</button>
                                    <button onClick={() => {
                                      setPopupState({
                                        isOpen: true,
                                        title: "Confirm Deletion",
                                        message: "Delete this method?",
                                        type: "confirm",
                                        onConfirm: () => {
                                          closePopup();
                                          const field = activeModal === "deposits" ? "deposit_methods" : "cashout_methods";
                                          const updated = formData[field].filter((_, idx) => idx !== i);
                                          const newData = { ...formData, [field]: updated };
                                          setFormData(newData);
                                          handleSave(newData);
                                        }
                                      });
                                    }} style={{ fontSize: "11px", background: "rgba(255,77,77,0.2)", color: "#ff4d4d" }}>Delete</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <hr style={{ opacity: 0.1, margin: "20px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0 }}>Additional Notes</h4>
                    {canManage && <button onClick={() => setIsEditingSection(!isEditingSection)} style={{ fontSize: "11px" }}>{isEditingSection ? "Cancel" : "Edit Notes"}</button>}
                  </div>
                  {isEditingSection ? (
                    <textarea 
                      style={{ height: "150px" }} 
                      value={activeModal === "deposits" ? formData.deposit_info : formData.cashout_rules} 
                      onChange={e => setFormData({...formData, [activeModal === "deposits" ? "deposit_info" : "cashout_rules"]: e.target.value})} 
                    />
                  ) : (
                    <pre style={{ background: "rgba(0,0,0,0.1)", padding: "15px", borderRadius: "10px", whiteSpace: "pre-wrap" }}>
                      {(activeModal === "deposits" ? formData.deposit_info : formData.cashout_rules) || "No additional info."}
                    </pre>
                  )}
                  {isEditingSection && <button onClick={() => handleSave()} style={{ background: "var(--primary)" }}>Save Notes</button>}
                </div>
              ) : isEditingSection && canManage ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {activeModal === "general" ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <span>Group?</span>
                        <button onClick={() => setBelongsToGroup(true)} style={{ background: belongsToGroup ? "var(--primary)" : "transparent" }}>Yes</button>
                        <button onClick={() => { setBelongsToGroup(false); setFormData({...formData, group_name: ""}) }} style={{ background: !belongsToGroup ? "var(--primary)" : "transparent" }}>No</button>
                      </div>
                      {belongsToGroup && (
                        <select value={formData.group_name} onChange={e => setFormData({...formData, group_name: e.target.value})}>
                          <option value="">-- Select Group --</option>
                          {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                          <option value="NEW">+ Create New Group</option>
                        </select>
                      )}
                      {formData.group_name === "NEW" && <input placeholder="Group Name" onBlur={e => setFormData({...formData, group_name: e.target.value})} />}
                      <input placeholder="Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                      <input placeholder="T&C Link" value={formData.tyc_link} onChange={e => setFormData({...formData, tyc_link: e.target.value})} />
                      <button onClick={handleDeleteCompany} style={{ marginTop: "20px", background: "rgba(255, 0, 0, 0.2)", color: "white" }}>⚠️ Delete Company</button>
                    </>
                  ) : (
                    <textarea style={{ height: "300px" }} value={formData[activeModal === "auto_promo" ? "auto_promos" : "manual_promos"]} 
                      onChange={e => {
                        const field = activeModal === "auto_promo" ? "auto_promos" : "manual_promos";
                        setFormData({...formData, [field]: e.target.value});
                      }} 
                    />
                  )}
                  <button onClick={() => handleSave()} style={{ background: "var(--primary)" }}>Save Changes</button>
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {activeModal === "general" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div className="glass-card" style={{ padding: "15px" }}><strong>Group:</strong> {formData.group_name || "None"}</div>
                      <div className="glass-card" style={{ padding: "15px", display: "flex", justifyContent: "space-between" }}>
                        <span><strong>Website:</strong> {formData.website || "N/A"}</span>
                        <button onClick={() => copyToClipboard(formData.website)}>Copy</button>
                      </div>
                      <div className="glass-card" style={{ padding: "15px", display: "flex", justifyContent: "space-between" }}>
                        <span><strong>T&C Link:</strong> {formData.tyc_link || "N/A"}</span>
                        <button onClick={() => copyToClipboard(formData.tyc_link)}>Copy</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <pre style={{ background: "rgba(0,0,0,0.1)", padding: "20px", borderRadius: "10px" }}>
                        {formData[activeModal === "auto_promo" ? "auto_promos" : "manual_promos"] || "No data saved."}
                      </pre>
                      <button style={{ marginTop: "15px", width: "100%" }} onClick={() => copyToClipboard(formData[activeModal === "auto_promo" ? "auto_promos" : "manual_promos"])}>Copy Entire Content</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Popup 
        isOpen={popupState.isOpen}
        onClose={closePopup}
        title={popupState.title}
        message={popupState.message}
        type={popupState.type}
        onConfirm={popupState.onConfirm}
      />
    </div>
  );
};

export default CompanyHub;