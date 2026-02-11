import React from "react";
import { addIncident } from "../api/client";

export default function IncidentForm({ operator, onAdd }) {
  const submit = async e => {
    e.preventDefault();
    const form = e.target;

    await addIncident({
      category: form.category.value,
      company: form.company.value,
      operationCode: form.operationCode.value,
      description: form.description.value,
      actionTaken: form.actionTaken.value,
      status: form.status.value,
      operator
    });

    form.reset();
    onAdd();
  };

  return (
    <form onSubmit={submit}>
      <h3>New Incident</h3>

      <input name="category" placeholder="Category" required />
      <input name="company" placeholder="Company" required />
      <input name="operationCode" placeholder="Operation Code (optional)" />
      <input name="description" placeholder="Description" required />
      <input name="actionTaken" placeholder="Action Taken" required />

      <select name="status">
        <option>Pending</option>
        <option>Important</option>
        <option>Completed</option>
      </select>

      <button>Add</button>
    </form>
  );
}
