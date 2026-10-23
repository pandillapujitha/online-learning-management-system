// Set VITE_API_URL when the API is hosted on a different domain.
const BASE = import.meta.env.VITE_API_URL || "";

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(BASE + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
