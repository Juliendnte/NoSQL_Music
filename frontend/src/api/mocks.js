import { artists, recordings, releases, collaborations, genres } from "./mockData";

// Simulates network latency so loading states are visible during dev.
const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const byId = (list, key) => new Map(list.map((item) => [item[key], item]));

const artistsById = byId(artists, "mbid");
const recordingsById = byId(recordings, "mbid");
const releasesById = byId(releases, "mbid");

function artistConnections(mbid) {
  return collaborations.filter((c) => c.source === mbid || c.target === mbid).length;
}

function collaboratorOf(mbid) {
  return collaborations
    .filter((c) => c.source === mbid || c.target === mbid)
    .map((c) => {
      const otherId = c.source === mbid ? c.target : c.source;
      return { artist: artistsById.get(otherId), weight: c.weight, recordingIds: c.recordingIds };
    })
    .filter((c) => c.artist);
}

export const mockApi = {
  async searchArtists(query) {
    await wait();
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  },

  async getArtists() {
    await wait();
    return artists.map((a) => ({ ...a, connections: artistConnections(a.mbid) }));
  },

  async getArtist(id) {
    await wait();
    const artist = artistsById.get(id);
    if (!artist) throw new Error(`Artist ${id} not found`);
    return { ...artist, connections: artistConnections(id) };
  },

  async getArtistRecordings(id) {
    await wait();
    return recordings.filter((r) => r.artistIds.includes(id));
  },

  async getArtistReleases(id) {
    await wait();
    const recIds = new Set(recordings.filter((r) => r.artistIds.includes(id)).map((r) => r.mbid));
    return releases.filter((rel) =>
      recordings.some((r) => recIds.has(r.mbid) && r.releaseIds.includes(rel.mbid))
    );
  },

  async getArtistCollaborations(id) {
    await wait();
    return collaboratorOf(id);
  },

  async getRecordings() {
    await wait();
    return recordings;
  },

  async getRecording(id) {
    await wait();
    const recording = recordingsById.get(id);
    if (!recording) throw new Error(`Recording ${id} not found`);
    return recording;
  },

  async getRecordingArtists(id) {
    await wait();
    const recording = recordingsById.get(id);
    if (!recording) return [];
    return recording.artistIds.map((aid) => artistsById.get(aid)).filter(Boolean);
  },

  async getReleases() {
    await wait();
    return releases;
  },

  async getRelease(id) {
    await wait();
    const release = releasesById.get(id);
    if (!release) throw new Error(`Release ${id} not found`);
    return release;
  },

  async getGraph() {
    await wait();
    return {
      nodes: artists.map((a) => ({ id: a.mbid, name: a.name, type: a.type, connections: artistConnections(a.mbid) })),
      edges: collaborations.map((c) => ({ source: c.source, target: c.target, weight: c.weight })),
    };
  },

  async getArtistGraph(id) {
    await wait();
    const neighborEdges = collaborations.filter((c) => c.source === id || c.target === id);
    const neighborIds = new Set([id, ...neighborEdges.flatMap((c) => [c.source, c.target])]);
    return {
      nodes: [...neighborIds].map((nid) => {
        const a = artistsById.get(nid);
        return { id: nid, name: a?.name ?? nid, type: a?.type, connections: artistConnections(nid) };
      }),
      edges: neighborEdges.map((c) => ({ source: c.source, target: c.target, weight: c.weight })),
    };
  },

  async getStatsOverview() {
    await wait();
    return {
      totalArtists: artists.length,
      totalRecordings: recordings.length,
      totalReleases: releases.length,
      totalCollaborations: collaborations.length,
      totalGenres: genres.length,
    };
  },

  async getTopCollaborations(limit = 5) {
    await wait();
    return [...collaborations]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map((c) => ({
        source: artistsById.get(c.source),
        target: artistsById.get(c.target),
        weight: c.weight,
      }));
  },

  async getTopArtists(limit = 5) {
    await wait();
    return [...artists]
      .map((a) => ({ ...a, connections: artistConnections(a.mbid) }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, limit);
  },

  async getTopGenres(limit = 6) {
    await wait();
    const counts = new Map();
    for (const artist of artists) {
      for (const genre of artist.genres ?? []) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  async getTopTracks(limit = 5) {
    await wait();
    return [...recordings].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
  },
};
