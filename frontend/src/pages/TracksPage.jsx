import { useState } from "react";
import { Music2 } from "lucide-react";
import { TrackRow } from "../components/track/TrackRow";
import { SearchInput } from "../components/ui/SearchInput";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { api } from "../api";

export function TracksPage() {
  const { data: recordings, loading: loadingRecordings } = useApi(() => api.getRecordings(), []);

  // The recording list doesn't embed artist names — resolved per-track in parallel
  // (bounded by the page's own limit, so this stays a handful of local requests).
  const { data: artistNamesByRecording, loading: loadingNames } = useApi(async () => {
    if (!recordings?.length) return new Map();
    const entries = await Promise.all(
      recordings.map(async (recording) => {
        const recordingArtists = await api.getRecordingArtists(recording.mbid);
        return [recording.mbid, recordingArtists.map((a) => a.name).join(", ")];
      })
    );
    return new Map(entries);
  }, [recordings]);

  const [query, setQuery] = useState("");
  const loading = loadingRecordings || loadingNames;

  const filtered = (recordings ?? []).filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Morceaux</h1>
        <p className="mt-1 text-sm text-foreground-muted">Recordings importés depuis MusicBrainz.</p>
      </div>

      <div className="max-w-xl">
        <SearchInput id="track-search" value={query} onChange={setQuery} placeholder="Filtrer par titre…" />
      </div>

      {loading && <Spinner />}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={Music2} title="Aucun morceau" description="Aucun résultat pour ce filtre." />
      )}

      {!loading && filtered.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filtered.map((recording) => (
            <li key={recording.mbid}>
              <TrackRow recording={recording} artistNames={artistNamesByRecording?.get(recording.mbid)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
