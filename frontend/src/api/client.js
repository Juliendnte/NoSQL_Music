const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

console.log("USE_MOCKS", USE_MOCKS);

export async function fetchJson(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail;
    try {
      detail = (await res.json())?.detail;
    } catch {
      // response body wasn't JSON, ignore
    }
    const error = new Error(detail || `${options?.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}
