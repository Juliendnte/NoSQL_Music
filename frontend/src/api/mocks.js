import { artists, recordings, releases, collaborations, genres } from "./mockData";

// Simulates network latency so loading states are visible during dev.
const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const notFound = (message) => {
  const error = new Error(message);
  error.status = 404;
  return error;
};

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
      const other = artistsById.get(otherId);
      const recordingTitles = c.recordingIds.map((rid) => recordingsById.get(rid)?.title).filter(Boolean);
      return { artist: other, sharedRecordings: Math.max(c.weight, recordingTitles.length), recordingTitles };
    })
    .filter((c) => c.artist);
}

export const mockApi = {
  // Demo dataset only contains already-"imported" artists, so search doubles
  // as the MusicBrainz-search stand-in (same response shape as the real API).
  async searchArtists(query) {
    await wait();
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return artists
      .filter((a) => a.name.toLowerCase().includes(q))
      .map((a) => ({
        mbid: a.mbid,
        name: a.name,
        country: a.country,
        type: a.type,
        beginDate: a.beginDate,
        disambiguation: a.disambiguation,
        score: 100,
      }));
  },

  async importArtist({ mbid }) {
    await wait(600);
    const artist = artistsById.get(mbid);
    if (!artist) throw notFound(`Artist ${mbid} not found on demo MusicBrainz mirror`);
    return {
      artist,
      recordingsImported: recordings.filter((r) => r.artistIds.includes(mbid)).length,
      releasesImported: releases.length ? 1 : 0,
      collaborationsDetected: artistConnections(mbid),
    };
  },

  async getArtists() {
    await wait();
    return artists.map((a) => ({ ...a, connections: artistConnections(a.mbid) }));
  },

  async getArtist(id) {
    await wait();
    const artist = artistsById.get(id);
    if (!artist) throw notFound(`Artist ${id} not found`);
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
    if (!recording) throw notFound(`Recording ${id} not found`);
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
    if (!release) throw notFound(`Release ${id} not found`);
    return release;
  },

  async getCollaborationGraph() {
    await wait();
    const nodes = artists.map((a) => ({ id: a.mbid, label: a.name, type: "Artist" }));
    // Mirror both directions like the real Neo4j COLLABORATED_WITH relationship,
    // so the graph consumer's dedup logic runs the same way against mocks and the real API.
    const edges = collaborations.flatMap((c) => [
      { source: c.source, target: c.target, type: "COLLABORATED_WITH" },
      { source: c.target, target: c.source, type: "COLLABORATED_WITH" },
    ]);
    return { nodes, edges };
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
        artist1: artistsById.get(c.source),
        artist2: artistsById.get(c.target),
        sharedRecordings: c.weight,
      }));
  },

  async getTopArtists(limit = 5) {
    await wait();
    return [...artists]
      .map((a) => ({ artist: a, connections: artistConnections(a.mbid) }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, limit);
  },

  async getTopGenres(limit = 6) {
    await wait();
    const counts = new Map();
    for (const artist of artists) {
      for (const genreName of artist.genres ?? []) {
        counts.set(genreName, (counts.get(genreName) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([genre, artistCount]) => ({ genre, artistCount }))
      .sort((a, b) => b.artistCount - a.artistCount)
      .slice(0, limit);
  },

  async getTopBridgeRecordings(limit = 5) {
    await wait();
    return [...recordings]
      .filter((r) => r.artistIds.length > 1)
      .sort((a, b) => b.artistIds.length - a.artistIds.length || b.popularity - a.popularity)
      .slice(0, limit)
      .map((recording) => ({ recording, artistCount: recording.artistIds.length }));
  },
};
