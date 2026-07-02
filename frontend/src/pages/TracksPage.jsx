import { useMemo, useState } from "react";
import { Music2 } from "lucide-react";
import { TrackRow } from "../components/track/TrackRow";
import { SearchInput } from "../components/ui/SearchInput";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { api } from "../api";

export function TracksPage() {
  const { data: recordings, loading: loadingRecordings } = useApi(() => api.getRecordings(), []);
  const { data: artists, loading: loadingArtists } = useApi(() => api.getArtists(), []);
  const [query, setQuery] = useState("");
  const loading = loadingRecordings || loadingArtists;

  const artistNameById = useMemo(() => {
    const map = new Map();
    for (const artist of artists ?? []) map.set(artist.mbid, artist.name);
    return map;
  }, [artists]);

  const filtered = useMemo(() => {
    if (!recordings) return [];
    const q = query.trim().toLowerCase();
    if (!q) return recordings;
    return recordings.filter((r) => r.title.toLowerCase().includes(q));
  }, [recordings, query]);

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
              <TrackRow
                recording={recording}
                artistNames={recording.artistIds?.map((aid) => artistNameById.get(aid)).filter(Boolean).join(", ")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
