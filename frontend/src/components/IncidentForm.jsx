import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function IncidentForm({
  onAdd,
  onUpdate,
  editingIncident,
  companies,
  categories,
  setCategories,
  operator,
  role
}) {
  const initialState = {
    shift: "",
    company: "",
    category: "",
    description: "",
    action_taken: "",
    status: "Pending"
  };

  const [formData, setFormData] = useState(initialState);

  const isValidName = (name) => {
    if (!name) return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && /^[a-zA-Z0-9 _-]+$/.test(trimmed);
  };

  useEffect(() => {
    if (editingIncident) {
      setFormData({
        shift: editingIncident.shift || "",
        company: editingIncident.company || "",
        category: editingIncident.category || "",
        description: editingIncident.description || "",
        action_taken: editingIncident.action_taken || "",
        status: editingIncident.status || "Pending"
      });
    } else {
      setFormData(initialState);
    }
  }, [editingIncident]);

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "category" && value === "ADD_NEW_CATEGORY") {
      const input = prompt("Enter new category name:");
      if (!input || !isValidName(input)) return alert("Invalid Name");

      try {
        const res = await fetch(`${API_URL}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Username": operator },
          body: JSON.stringify({ name: input.trim() })
        });
        if (res.ok) {
          const updated = await fetch(`${API_URL}/categories`).then(r => r.json());
          setCategories(updated);
          setFormData(prev => ({ ...prev, category: input.trim() }));
        }
      } catch (err) { console.error(err); }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteCategory = async () => {
    if (!formData.category || formData.category === "ADD_NEW_CATEGORY") return;
    if (!window.confirm(`Delete "${formData.category}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/categories/${encodeURIComponent(formData.category)}`, {
        method: "DELETE",
        headers: { "Username": operator }
      });

      if (!response.ok) {
        // 🚨 This is the alert you were missing!
        alert("No se puede eliminar, categoria en uso");
        return;
      }

      const updated = await fetch(`${API_URL}/categories`).then(res => res.json());
      setCategories(updated);
      setFormData(prev => ({ ...prev, category: "" }));
    } catch (error) {
      console.error("Server error:", error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <form onSubmit={(e) => { 
      e.preventDefault(); 
      const data = { ...formData, operator, id: editingIncident?.id };
      editingIncident ? onUpdate(data) : onAdd(data);
      setFormData(initialState);
    }} className="incident-form-container">
      
      <select name="shift" value={formData.shift} onChange={handleChange} required>
        <option value="">Select Shift</option>
        <option value="Morning">Morning</option>
        <option value="Evening">Evening</option>
        <option value="Night">Night</option>
      </select>

      <select name="company" value={formData.company} onChange={handleChange} required>
        <option value="">Select Company</option>
        {companies.map((c, i) => (
          <option key={i} value={c.name}>{c.name} {c.group_name ? `(${c.group_name})` : ""}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <select name="category" value={formData.category} onChange={handleChange} required style={{ flex: 1 }}>
          <option value="">Select Category</option>
          {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
          {role !== "operator" && <option value="ADD_NEW_CATEGORY">➕ Add Category</option>}
        </select>
        
        {formData.category && formData.category !== "ADD_NEW_CATEGORY" && role !== "operator" && (
          <button type="button" onClick={handleDeleteCategory} style={{ padding: "5px 10px" }}>🗑</button>
        )}
      </div>

      <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
      <textarea name="action_taken" placeholder="Action Taken" value={formData.action_taken} onChange={handleChange} />

      <button type="submit" className="submit-btn" style={{ background: editingIncident ? "orange" : "var(--primary)" }}>
        {editingIncident ? "Update Incident" : "Add Incident"}
      </button>
    </form>
  );
}

export default IncidentForm;