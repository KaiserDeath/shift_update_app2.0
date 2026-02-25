// dynamically get API URL from env, fallback to local dev
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// ADD THIS FUNCTION (does not affect existing ones)
export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return res.json();
}

// EXISTING FUNCTIONS — UNCHANGED
export async function getIncidents() {
  const res = await fetch(`${API_URL}/incidents`);
  return res.json();
}

export async function addIncident(data) {
  const res = await fetch(`${API_URL}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateIncidentStatus(id, status) {
  await fetch(`${API_URL}/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
