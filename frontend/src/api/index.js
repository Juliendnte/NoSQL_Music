import { fetchJson, USE_MOCKS } from "./client";
import { mockApi } from "./mocks";

const q = (params) => {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "");
  const search = new URLSearchParams(entries).toString();
  return search ? `?${search}` : "";
};

export const api = USE_MOCKS
  ? mockApi
  : {
      searchArtists: (query) => fetchJson(`/search/artists${q({ q: query })}`),
      getArtists: () => fetchJson("/artists"),
      getArtist: (id) => fetchJson(`/artists/${id}`),
      getArtistRecordings: (id) => fetchJson(`/artists/${id}/recordings`),
      getArtistReleases: (id) => fetchJson(`/artists/${id}/releases`),
      getArtistCollaborations: (id) => fetchJson(`/artists/${id}/collaborations`),

      getRecordings: () => fetchJson("/recordings"),
      getRecording: (id) => fetchJson(`/recordings/${id}`),
      getRecordingArtists: (id) => fetchJson(`/recordings/${id}/artists`),

      getReleases: () => fetchJson("/releases"),
      getRelease: (id) => fetchJson(`/releases/${id}`),

      getGraph: () => fetchJson("/graph"),
      getArtistGraph: (id) => fetchJson(`/graph/artists/${id}`),

      getStatsOverview: () => fetchJson("/stats/overview"),
      getTopCollaborations: (limit) => fetchJson(`/stats/top-collaborations${q({ limit })}`),
      getTopArtists: (limit) => fetchJson(`/stats/top-artists${q({ limit })}`),
      getTopGenres: (limit) => fetchJson(`/stats/top-genres${q({ limit })}`),
      getTopTracks: (limit) => fetchJson(`/stats/top-tracks${q({ limit })}`),
    };
