import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Share2, Download } from "lucide-react";
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
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [importState, setImportState] = useState("idle"); // idle | importing | error
  const [importError, setImportError] = useState(null);

  const { data: artist, loading, error } = useApi(() => api.getArtist(id), [id, refreshKey]);
  const { data: recordings } = useApi(() => api.getArtistRecordings(id), [id, refreshKey]);
  const { data: releases } = useApi(() => api.getArtistReleases(id), [id, refreshKey]);
  const { data: collaborations } = useApi(() => api.getArtistCollaborations(id), [id, refreshKey]);

  async function handleImport() {
    setImportState("importing");
    setImportError(null);
    try {
      await api.importArtist({ mbid: id });
      setImportState("idle");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setImportState("error");
      setImportError(err.message);
    }
  }

  if (loading) return <Spinner label="Chargement de l'artiste…" />;

  if (error?.status === 404) {
    const name = location.state?.name;
    return (
      <EmptyState
        icon={Download}
        title={name ? `« ${name} » n'est pas encore importé` : "Artiste non importé"}
        description="Cet artiste existe sur MusicBrainz mais n'a pas encore été ajouté à la base Neo4j. Importe-le pour voir ses morceaux, releases et collaborations."
        action={
          importState === "importing" ? (
            <Spinner label="Import depuis MusicBrainz en cours (quelques secondes)…" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                <Download className="size-4" aria-hidden="true" />
                Importer depuis MusicBrainz
              </button>
              {importState === "error" && <p className="text-sm text-destructive">{importError}</p>}
            </div>
          )
        }
      />
    );
  }

  if (error || !artist) {
    return (
      <EmptyState
        title="Erreur"
        description={error?.message ?? "Impossible de charger cet artiste."}
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
            {artist.type && <Badge>{artist.type}</Badge>}
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
                <TrackRow recording={recording} role={recording.role} />
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
            {collaborations.map(({ artist: collaborator, sharedRecordings, recordingTitles }) => (
              <li key={collaborator.mbid}>
                <Link
                  to={`/artists/${collaborator.mbid}`}
                  state={{ name: collaborator.name }}
                  title={recordingTitles?.join(", ")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3.5 text-sm text-foreground transition-colors hover:border-accent"
                >
                  <span className="flex size-6 items-center justify-center rounded-full border border-border bg-surface-muted text-[11px] font-semibold text-foreground">
                    {initials(collaborator.name)}
                  </span>
                  {collaborator.name}
                  <span className="flex items-center gap-1 text-xs text-foreground-muted tabular-nums">
                    <Share2 className="size-3" aria-hidden="true" />
                    {sharedRecordings}
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
