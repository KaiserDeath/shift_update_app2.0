const API_URL = "https://shiftupdateapp20-production.up.railway.app";

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
