import React, { useState, useEffect } from "react";

function IncidentForm({
  onAdd,
  onUpdate,
  editingIncident,
  companies,
  setCompanies,
  categories,
  setCategories,
  operator
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

  // 🔁 Load data when editing
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
    const { name, value } = e.target;

    // ➕ Add new company
    if (name === "company" && value === "ADD_NEW_COMPANY") {
      const newCompany = prompt("Enter new company name:");
      if (!newCompany) return;

      fetch("http://127.0.0.1:5000/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompany })
      })
      .then(() => fetch("http://127.0.0.1:5000/companies"))
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        setFormData(prev => ({ ...prev, company: newCompany }));
      });

      return;
    }

    // ➕ Add new category
    if (name === "category" && value === "ADD_NEW_CATEGORY") {
      const newCategory = prompt("Enter new category name:");
      if (!newCategory) return;

      fetch("http://127.0.0.1:5000/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory })
      })
      .then(() => fetch("http://127.0.0.1:5000/categories"))
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setFormData(prev => ({ ...prev, category: newCategory }));
      });

      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialState);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const incidentData = {
      ...formData,
      operator,
      id: editingIncident?.id
    };

    // 🚨 NO FETCH HERE ANYMORE
    if (editingIncident) {
      onUpdate(incidentData);
    } else {
      onAdd(incidentData);
    }

    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>

      {/* SHIFT */}
      <div style={{ marginBottom: "10px" }}>
        <select
          name="shift"
          value={formData.shift}
          onChange={handleChange}
          required
        >
          <option value="">Select Shift</option>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Night">Night</option>
        </select>
      </div>

      {/* COMPANY */}
      <div style={{ marginBottom: "10px" }}>
        <select
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
        >
          <option value="">Select Company</option>

          {companies.map((company, index) => (
            <option key={index} value={company}>
              {company}
            </option>
          ))}

          <option value="ADD_NEW_COMPANY">➕ Add new company</option>
        </select>

        {formData.company &&
         formData.company !== "ADD_NEW_COMPANY" && (
          <button
            type="button"
            style={{ marginLeft: "10px" }}
            onClick={async () => {
              if (!window.confirm("Delete this company?")) return;

              const response = await fetch(
                `http://127.0.0.1:5000/companies/${encodeURIComponent(formData.company)}`,
                { method: "DELETE" }
              );

              if (!response.ok) {
                alert("No se puede eliminar, compañia en uso");
                return;
              }

              const updated = await fetch("http://127.0.0.1:5000/companies")
                .then(res => res.json());

              setCompanies(updated);
              setFormData(prev => ({ ...prev, company: "" }));
            }}
          >
            🗑
          </button>
        )}
      </div>

      {/* CATEGORY */}
      <div style={{ marginBottom: "10px" }}>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>

          {categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}

          <option value="ADD_NEW_CATEGORY">➕ Add new category</option>
        </select>

        {formData.category &&
         formData.category !== "ADD_NEW_CATEGORY" && (
          <button
            type="button"
            style={{ marginLeft: "10px" }}
            onClick={async () => {
              if (!window.confirm("Delete this category?")) return;

              const response = await fetch(
                `http://127.0.0.1:5000/categories/${encodeURIComponent(formData.category)}`,
                { method: "DELETE" }
              );

              if (!response.ok) {
                alert("No se puede eliminar, categoria en uso");
                return;
              }

              const updated = await fetch("http://127.0.0.1:5000/categories")
                .then(res => res.json());

              setCategories(updated);
              setFormData(prev => ({ ...prev, category: "" }));
            }}
          >
            🗑
          </button>
        )}
      </div>

      {/* DESCRIPTION */}
      <div style={{ marginBottom: "10px" }}>
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      {/* ACTION TAKEN */}
      <div style={{ marginBottom: "10px" }}>
        <textarea
          name="action_taken"
          placeholder="Action Taken"
          value={formData.action_taken}
          onChange={handleChange}
        />
      </div>

      <button type="submit">
        {editingIncident ? "Update Incident" : "Add Incident"}
      </button>

    </form>
  );
}

export default IncidentForm;
