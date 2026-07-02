import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchCode, ServerCrash } from "lucide-react";
import { SearchInput } from "../components/ui/SearchInput";
import { ArtistCard } from "../components/artist/ArtistCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { api } from "../api";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    setParams(trimmed ? { q: trimmed } : {}, { replace: true });

    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Guards against a slow, now-stale request overwriting a newer one's result.
    let active = true;
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      api
        .searchArtists(trimmed)
        .then((data) => {
          if (!active) return;
          setResults(data);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          setError(err);
          setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, retryToken]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Rechercher un artiste</h1>
        <p className="mt-1 text-sm text-foreground-muted">Par nom, disponible via l'API MusicBrainz importée en base.</p>
      </div>

      <div className="max-w-xl">
        <SearchInput value={query} onChange={setQuery} autoFocus />
      </div>

      {loading && <Spinner label="Recherche…" />}

      {!loading && error && (
        <EmptyState
          icon={ServerCrash}
          title="Recherche indisponible"
          description={`MusicBrainz n'a pas répondu (${error.message}). Le service externe est parfois instable, réessaie dans un instant.`}
          action={
            <button
              type="button"
              onClick={() => setRetryToken((t) => t + 1)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Réessayer
            </button>
          }
        />
      )}

      {!loading && !error && query.trim() && results.length === 0 && (
        <EmptyState
          icon={SearchCode}
          title="Aucun artiste trouvé"
          description={`Aucun résultat pour « ${query.trim()} ». Essayez un autre nom.`}
        />
      )}

      {!loading && !error && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((artist) => (
            <li key={artist.mbid}>
              <ArtistCard artist={artist} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
