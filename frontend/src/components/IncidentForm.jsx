import React, { useState, useEffect } from "react";

function IncidentForm({
  onAdd,
  onUpdate,
  editingIncident,
  companies,
  setCompanies,
  categories,
  setCategories,
  operator,
  role // ✅ added role prop
}) {

  const initialState = {
    shift: "",
    company: "",
    category: "",
    description: "",
    action_taken: "",
    status: "Pending"
  };

  // 🔒 Validation helper
  const isValidName = (name) => {
    if (!name) return false;

    const trimmed = name.trim();

    if (trimmed.length < 2) return false;
    if (trimmed.length > 50) return false;

    // Must contain at least one letter or number
    if (!/[a-zA-Z0-9]/.test(trimmed)) return false;

    // Allow only letters, numbers, spaces, dash and underscore
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return false;

    return true;
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

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // ➕ ADD NEW COMPANY
    if (name === "company" && value === "ADD_NEW_COMPANY") {
      const input = prompt("Enter new company name:");
      if (!input) return;

      const newCompany = input.trim();

      if (!isValidName(newCompany)) {
        alert("Invalid company name. Use letters and numbers only (min 2 characters).");
        return;
      }

      if (companies.includes(newCompany)) {
        alert("Company already exists.");
        setFormData(prev => ({ ...prev, company: newCompany }));
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/companies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Username": operator
          },
          body: JSON.stringify({ name: newCompany })
        });

        if (!response.ok) {
          alert("Error creating company.");
          return;
        }

        const updated = await fetch("http://127.0.0.1:5000/companies")
          .then(res => res.json());

        setCompanies(updated);
        setFormData(prev => ({ ...prev, company: newCompany }));

      } catch (error) {
        console.error(error);
        alert("Server error.");
      }

      return;
    }

    // ➕ ADD NEW CATEGORY
    if (name === "category" && value === "ADD_NEW_CATEGORY") {
      const input = prompt("Enter new category name:");
      if (!input) return;

      const newCategory = input.trim();

      if (!isValidName(newCategory)) {
        alert("Invalid category name. Use letters and numbers only (min 2 characters).");
        return;
      }

      if (categories.includes(newCategory)) {
        alert("Category already exists.");
        setFormData(prev => ({ ...prev, category: newCategory }));
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Username": operator
          },
          body: JSON.stringify({ name: newCategory })
        });

        if (!response.ok) {
          alert("Error creating category.");
          return;
        }

        const updated = await fetch("http://127.0.0.1:5000/categories")
          .then(res => res.json());

        setCategories(updated);
        setFormData(prev => ({ ...prev, category: newCategory }));

      } catch (error) {
        console.error(error);
        alert("Server error.");
      }

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

          {/* only supervisors and admins can see add new company */}
          {role !== "operator" && (
            <option value="ADD_NEW_COMPANY">➕ Add new company</option>
          )}
        </select>

        {/* only supervisors and admins can see delete company button */}
        {formData.company &&
         formData.company !== "ADD_NEW_COMPANY" &&
         role !== "operator" && (
          <button
            type="button"
            style={{ marginLeft: "10px" }}
            onClick={async () => {
              if (!window.confirm("Delete this company?")) return;

              const response = await fetch(
                `http://127.0.0.1:5000/companies/${encodeURIComponent(formData.company)}`,
                {
                  method: "DELETE",
                  headers: { "Username": operator }
                }
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

          {/* only supervisors and admins can see add new category */}
          {role !== "operator" && (
            <option value="ADD_NEW_CATEGORY">➕ Add new category</option>
          )}
        </select>

        {/* only supervisors and admins can see delete category button */}
        {formData.category &&
         formData.category !== "ADD_NEW_CATEGORY" &&
         role !== "operator" && (
          <button
            type="button"
            style={{ marginLeft: "10px" }}
            onClick={async () => {
              if (!window.confirm("Delete this category?")) return;

              const response = await fetch(
                `http://127.0.0.1:5000/categories/${encodeURIComponent(formData.category)}`,
                {
                  method: "DELETE",
                  headers: { "Username": operator }
                }
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