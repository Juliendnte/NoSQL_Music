import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { ArtistCard } from "../components/artist/ArtistCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { api } from "../api";

export function ArtistsPage() {
  const { data: artists, loading: loadingArtists } = useApi(() => api.getArtists(), []);
  // Connections aren't embedded on plain artist records — merged in from the
  // top-artists stat (capped at 50, the backend's max limit for that endpoint).
  const { data: topArtists, loading: loadingTop } = useApi(() => api.getTopArtists(50), []);
  const [sort, setSort] = useState("name");
  const loading = loadingArtists || loadingTop;

  const connectionsById = useMemo(() => {
    const map = new Map();
    for (const entry of topArtists ?? []) map.set(entry.artist.mbid, entry.connections);
    return map;
  }, [topArtists]);

  const sorted = useMemo(() => {
    if (!artists) return [];
    const withConnections = artists.map((a) => ({ ...a, connections: connectionsById.get(a.mbid) ?? 0 }));
    return withConnections.sort((a, b) =>
      sort === "connections" ? b.connections - a.connections : a.name.localeCompare(b.name)
    );
  }, [artists, connectionsById, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Artistes</h1>
          <p className="mt-1 text-sm text-foreground-muted tabular-nums">
            {loading ? "…" : `${sorted.length} artistes importés`}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground-muted">
          Trier par
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-foreground outline-none focus-visible:border-accent"
          >
            <option value="name">Nom</option>
            <option value="connections">Collaborations</option>
          </select>
        </label>
      </div>

      {loading && <Spinner />}

      {!loading && sorted.length === 0 && (
        <EmptyState icon={Users} title="Aucun artiste importé" description="Lancez un import MusicBrainz pour peupler la base." />
      )}

      {!loading && sorted.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sorted.map((artist) => (
            <li key={artist.mbid}>
              <ArtistCard artist={artist} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
