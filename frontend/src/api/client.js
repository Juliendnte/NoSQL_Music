const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export async function fetchJson(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`${options?.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
