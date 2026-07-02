import { Link } from "react-router-dom";
import { Users, Music2, Disc3, Share2 } from "lucide-react";
import { StatCard } from "../components/charts/StatCard";
import { BarListChart } from "../components/charts/BarListChart";
import { Card } from "../components/ui/Card";
import { TrackRow } from "../components/track/TrackRow";
import { Spinner } from "../components/ui/Spinner";
import { initials } from "../lib/format";
import { useApi } from "../hooks/useApi";
import { api } from "../api";

export function StatsPage() {
  const { data: overview, loading: loadingOverview } = useApi(() => api.getStatsOverview(), []);
  const { data: topArtists, loading: loadingTopArtists } = useApi(() => api.getTopArtists(6), []);
  const { data: topGenres, loading: loadingTopGenres } = useApi(() => api.getTopGenres(6), []);
  const { data: topCollaborations, loading: loadingTopCollabs } = useApi(() => api.getTopCollaborations(5), []);
  const { data: topBridgeRecordings, loading: loadingBridges } = useApi(() => api.getTopBridgeRecordings(5), []);

  const topArtistsChartData = (topArtists ?? []).map((t) => ({ name: t.artist.name, value: t.connections }));
  const topGenresChartData = (topGenres ?? []).map((g) => ({ name: g.genre, value: g.artistCount }));

  const loading = loadingOverview || loadingTopArtists || loadingTopGenres || loadingTopCollabs || loadingBridges;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Statistiques</h1>
        <p className="mt-1 text-sm text-foreground-muted">Analyse du graphe de collaborations importé.</p>
      </div>

      {loading && <Spinner />}

      {!loading && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Artistes" value={overview?.totalArtists ?? 0} />
            <StatCard icon={Music2} label="Morceaux" value={overview?.totalRecordings ?? 0} />
            <StatCard icon={Disc3} label="Releases" value={overview?.totalReleases ?? 0} />
            <StatCard icon={Share2} label="Collaborations" value={overview?.totalCollaborations ?? 0} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Artistes les plus connectés</h2>
              <BarListChart data={topArtistsChartData} />
            </Card>
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Genres dominants</h2>
              <BarListChart data={topGenresChartData} colorByIndex />
            </Card>
          </div>

          <section aria-labelledby="top-collabs-heading" className="flex flex-col gap-3">
            <h2 id="top-collabs-heading" className="text-lg font-semibold text-foreground">
              Top collaborations
            </h2>
            <ul className="flex flex-col gap-2">
              {(topCollaborations ?? []).map(({ artist1, artist2, sharedRecordings }, i) => (
                <li key={i}>
                  <Card className="flex items-center gap-3 p-3.5">
                    <span className="flex items-center -space-x-2">
                      <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-[11px] font-semibold text-foreground">
                        {initials(artist1.name)}
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-[11px] font-semibold text-foreground">
                        {initials(artist2.name)}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      <Link to={`/artists/${artist1.mbid}`} state={{ name: artist1.name }} className="hover:underline">
                        {artist1.name}
                      </Link>
                      {" × "}
                      <Link to={`/artists/${artist2.mbid}`} state={{ name: artist2.name }} className="hover:underline">
                        {artist2.name}
                      </Link>
                    </span>
                    <span className="shrink-0 text-sm text-foreground-muted tabular-nums">{sharedRecordings} morceau(x)</span>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="top-bridges-heading" className="flex flex-col gap-3">
            <h2 id="top-bridges-heading" className="text-lg font-semibold text-foreground">
              Morceaux ponts
            </h2>
            <p className="-mt-2 text-sm text-foreground-muted">Les titres qui relient le plus d'artistes différents.</p>
            <ul className="flex flex-col gap-2">
              {(topBridgeRecordings ?? []).map(({ recording, artistCount }) => (
                <li key={recording.mbid}>
                  <TrackRow recording={recording} artistNames={`${artistCount} artistes`} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
