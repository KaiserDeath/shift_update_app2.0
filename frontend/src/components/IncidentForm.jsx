import React, { useState, useEffect } from "react";
import Popup from "./Popup";

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPrivate, setNewCategoryPrivate] = useState(false);

  // Popup state
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  const closePopup = () => setPopupState(prev => ({ ...prev, isOpen: false }));

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category" && value === "ADD_NEW_CATEGORY") {
      if (role === "operator") return; // Operators cannot add categories
      setNewCategoryName("");
      setNewCategoryPrivate(false);
      setShowCategoryModal(true);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddCategory = async () => {
    if (!isValidName(newCategoryName)) {
      setPopupState({
        isOpen: true,
        title: "Error",
        message: "Invalid category name",
        type: "alert",
        onConfirm: closePopup
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Username: operator },
        body: JSON.stringify({ name: newCategoryName.trim(), private: newCategoryPrivate })
      });

      if (!res.ok) throw new Error("Failed to add category");

      // Fetch updated categories from server
      const updated = await fetch(`${API_URL}/categories`).then(r => r.json());
      const normalized = updated.map(c => (typeof c === "string" ? { name: c, private: false } : { name: c.name, private: c.private ?? false }));
      setCategories(normalized);

      // Update formData so select shows the new category
      setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
      setShowCategoryModal(false);
    } catch (err) {
      console.error(err);
      setPopupState({
        isOpen: true,
        title: "Error",
        message: "Error creating category",
        type: "alert",
        onConfirm: closePopup
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!formData.category || formData.category === "ADD_NEW_CATEGORY") return;
    
    setPopupState({
      isOpen: true,
      title: "Confirm Deletion",
      message: `Delete "${formData.category}"?`,
      type: "confirm",
      onConfirm: async () => {
        closePopup();
        try {
          const response = await fetch(`${API_URL}/categories/${encodeURIComponent(formData.category)}`, {
            method: "DELETE",
            headers: { "Username": operator }
          });

          if (!response.ok) {
            setTimeout(() => {
              setPopupState({
                isOpen: true,
                title: "Error",
                message: "Cannot delete: category in use",
                type: "alert",
                onConfirm: closePopup
              });
            }, 300);
            return;
          }

          const updated = await fetch(`${API_URL}/categories`).then(res => res.json());
          const normalized = updated.map(c => (typeof c === "string" ? { name: c, private: false } : { name: c.name, private: c.private ?? false }));
          setCategories(normalized);
          setFormData(prev => ({ ...prev, category: "" }));
        } catch (error) {
          console.error("Server error:", error);
          setTimeout(() => {
            setPopupState({
              isOpen: true,
              title: "Error",
              message: "Error connecting to server",
              type: "alert",
              onConfirm: closePopup
            });
          }, 300);
        }
      }
    });
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = { ...formData, operator, id: editingIncident?.id };
          editingIncident ? onUpdate(data) : onAdd(data);
          setFormData(initialState);
        }}
        className="incident-form-container"
      >
        <select name="shift" value={formData.shift} onChange={handleChange} required>
          <option value="">Select Shift</option>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Night">Night</option>
        </select>

        <select name="company" value={formData.company} onChange={handleChange} required>
          <option value="">Select Company</option>
          {companies.map((c, i) => (
            <option key={i} value={c.name}>
              {c.name} {c.group_name ? `(${c.group_name})` : ""}
            </option>
          ))}
        </select>

        <div className="category-select-wrapper">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories
              .filter(cat => (role === "operator" ? !cat.private : true))
              .map((cat, i) => (
                <option
                  key={i}
                  value={cat.name}
                  style={{
                    fontWeight: cat.private ? "bold" : "normal",
                    color: cat.private ? "#d9534f" : "inherit"
                  }}
                  title={cat.private ? "Private: Only visible to supervisors/admins" : ""}
                >
                  {cat.name} {cat.private ? "🔒" : ""}
                </option>
              ))
            }
            {role !== "operator" && <option value="ADD_NEW_CATEGORY">➕ Add Category</option>}
          </select>

          {formData.category && formData.category !== "ADD_NEW_CATEGORY" && role !== "operator" && (
            <button type="button" onClick={handleDeleteCategory} className="delete-category-btn">🗑</button>
          )}
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <textarea
          name="action_taken"
          placeholder="Action Taken"
          value={formData.action_taken}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="submit-btn"
          style={{ background: editingIncident ? "orange" : "var(--primary)" }}
        >
          {editingIncident ? "Update Incident" : "Add Incident"}
        </button>
      </form>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <label className="private-checkbox">
              <input
                type="checkbox"
                checked={newCategoryPrivate}
                onChange={(e) => setNewCategoryPrivate(e.target.checked)}
              />
              Private (Only visible to supervisors/admins)
            </label>
            <div className="modal-btns">
              <button type="button" onClick={handleAddCategory} className="submit-btn">Add</button>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="cancel-btn">Cancel</button>
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
    </>
  );
}

export default IncidentForm;