import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Users, Music2, Disc3, Share2 } from "lucide-react";
import { SearchInput } from "../components/ui/SearchInput";
import { StatCard } from "../components/charts/StatCard";
import { Spinner } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { api } from "../api";

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: overview, loading } = useApi(() => api.getStatsOverview(), []);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 pt-4 sm:pt-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">MusicGraph</h1>
          <p className="mt-2 max-w-xl text-foreground-muted">
            Explorez les artistes, morceaux et collaborations musicales à partir des données MusicBrainz,
            modélisées en graphe dans Neo4j.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl">
          <SearchInput value={query} onChange={setQuery} autoFocus />
        </form>
      </section>

      <section aria-label="Aperçu des données">
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Artistes" value={overview?.totalArtists ?? 0} />
            <StatCard icon={Music2} label="Morceaux" value={overview?.totalRecordings ?? 0} />
            <StatCard icon={Disc3} label="Releases" value={overview?.totalReleases ?? 0} />
            <StatCard icon={Share2} label="Collaborations" value={overview?.totalCollaborations ?? 0} />
          </div>
        )}
      </section>
    </div>
  );
}
