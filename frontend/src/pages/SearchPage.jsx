import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchCode } from "lucide-react";
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

  useEffect(() => {
    const trimmed = query.trim();
    setParams(trimmed ? { q: trimmed } : {}, { replace: true });

    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      api.searchArtists(trimmed).then((data) => {
        setResults(data);
        setLoading(false);
      });
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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

      {!loading && query.trim() && results.length === 0 && (
        <EmptyState
          icon={SearchCode}
          title="Aucun artiste trouvé"
          description={`Aucun résultat pour « ${query.trim()} ». Essayez un autre nom.`}
        />
      )}

      {!loading && results.length > 0 && (
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
