import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../api";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { TrackRow } from "../components/track/TrackRow";
import { ReleaseCard } from "../components/release/ReleaseCard";
import { initials } from "../lib/format";

export function ArtistDetailPage() {
  const { id } = useParams();
  const { data: artist, loading, error } = useApi(() => api.getArtist(id), [id]);
  const { data: recordings } = useApi(() => api.getArtistRecordings(id), [id]);
  const { data: releases } = useApi(() => api.getArtistReleases(id), [id]);
  const { data: collaborations } = useApi(() => api.getArtistCollaborations(id), [id]);

  if (loading) return <Spinner label="Chargement de l'artiste…" />;

  if (error || !artist) {
    return (
      <EmptyState
        title="Artiste introuvable"
        description="Cet artiste n'existe pas ou n'a pas encore été importé."
        action={
          <Link to="/artists" className="text-sm font-medium text-accent hover:underline">
            Retour à la liste
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Link to="/artists" className="inline-flex w-fit items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Artistes
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted font-display text-lg font-semibold text-foreground">
          {initials(artist.name)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{artist.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge>{artist.type}</Badge>
            {artist.country && <Badge>{artist.country}</Badge>}
            {artist.beginDate && (
              <span className="text-sm text-foreground-muted tabular-nums">
                {artist.beginDate}
                {artist.endDate ? ` – ${artist.endDate}` : " – présent"}
              </span>
            )}
          </div>
          {artist.disambiguation && <p className="mt-1.5 text-sm text-foreground-muted">{artist.disambiguation}</p>}
        </div>
      </header>

      <section aria-labelledby="tracks-heading" className="flex flex-col gap-3">
        <h2 id="tracks-heading" className="text-lg font-semibold text-foreground">
          Morceaux
        </h2>
        {recordings?.length ? (
          <ul className="flex flex-col gap-2">
            {recordings.map((recording) => (
              <li key={recording.mbid}>
                <TrackRow recording={recording} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground-muted">Aucun morceau associé pour le moment.</p>
        )}
      </section>

      <section aria-labelledby="releases-heading" className="flex flex-col gap-3">
        <h2 id="releases-heading" className="text-lg font-semibold text-foreground">
          Releases
        </h2>
        {releases?.length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {releases.map((release) => (
              <li key={release.mbid}>
                <ReleaseCard release={release} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground-muted">Aucune release associée pour le moment.</p>
        )}
      </section>

      <section aria-labelledby="collabs-heading" className="flex flex-col gap-3">
        <h2 id="collabs-heading" className="text-lg font-semibold text-foreground">
          Collaborations
        </h2>
        {collaborations?.length ? (
          <ul className="flex flex-wrap gap-2">
            {collaborations.map(({ artist: collaborator, weight }) => (
              <li key={collaborator.mbid}>
                <Link
                  to={`/artists/${collaborator.mbid}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3.5 text-sm text-foreground transition-colors hover:border-accent"
                >
                  <span className="flex size-6 items-center justify-center rounded-full border border-border bg-surface-muted text-[11px] font-semibold text-foreground">
                    {initials(collaborator.name)}
                  </span>
                  {collaborator.name}
                  <span className="flex items-center gap-1 text-xs text-foreground-muted tabular-nums">
                    <Share2 className="size-3" aria-hidden="true" />
                    {weight}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground-muted">Aucune collaboration détectée pour le moment.</p>
        )}
      </section>
    </div>
  );
}
