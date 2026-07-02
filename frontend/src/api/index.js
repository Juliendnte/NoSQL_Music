import { fetchJson, USE_MOCKS } from "./client";
import { mockApi } from "./mocks";

const q = (params) => {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "");
  const search = new URLSearchParams(entries).toString();
  return search ? `?${search}` : "";
};

const realApi = {
  searchArtists: (query, limit) => fetchJson(`/search/artists${q({ q: query, limit })}`),
  importArtist: ({ mbid, maxRecordings, maxReleases }) =>
    fetchJson("/import/artists", {
      method: "POST",
      body: JSON.stringify({ mbid, maxRecordings, maxReleases }),
    }),

  getArtists: async (params) => (await fetchJson(`/artists${q(params)}`)).items,
  getArtist: (id) => fetchJson(`/artists/${id}`),
  getArtistRecordings: (id, limit) => fetchJson(`/artists/${id}/recordings${q({ limit })}`),
  getArtistReleases: (id, limit) => fetchJson(`/artists/${id}/releases${q({ limit })}`),
  getArtistCollaborations: (id, limit) => fetchJson(`/artists/${id}/collaborations${q({ limit })}`),

  getRecordings: (params) => fetchJson(`/recordings${q(params)}`),
  getRecording: (id) => fetchJson(`/recordings/${id}`),
  getRecordingArtists: (id) => fetchJson(`/recordings/${id}/artists`),

  getReleases: (params) => fetchJson(`/releases${q(params)}`),
  getRelease: (id) => fetchJson(`/releases/${id}`),

  // /graph/collaborations returns Artist-only nodes/edges — the cleanest shape for the network view.
  getCollaborationGraph: (limit) => fetchJson(`/graph/collaborations${q({ limit })}`),

  getStatsOverview: () => fetchJson("/stats/overview"),
  getTopCollaborations: (limit) => fetchJson(`/stats/top-collaborations${q({ limit })}`),
  getTopArtists: (limit) => fetchJson(`/stats/top-artists${q({ limit })}`),
  getTopGenres: (limit) => fetchJson(`/stats/top-genres${q({ limit })}`),
  getTopBridgeRecordings: (limit) => fetchJson(`/stats/top-bridge-recordings${q({ limit })}`),
};

export const api = USE_MOCKS ? mockApi : realApi;
