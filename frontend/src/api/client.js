const API_URL = "http://127.0.0.1:5000";

export async function getIncidents() {
  const res = await fetch(`${API_URL}/incidents`);
  return res.json();
}

export async function addIncident(data) {
  await fetch(`${API_URL}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
