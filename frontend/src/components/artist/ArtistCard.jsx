import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { initials } from "../../lib/format";

export function ArtistCard({ artist }) {
  return (
    <Card
      as={Link}
      to={`/artists/${artist.mbid}`}
      className="flex items-center gap-4 p-4 transition-colors hover:border-accent focus-visible:border-accent"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted font-display text-sm font-semibold text-foreground">
        {initials(artist.name)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{artist.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge>{artist.type}</Badge>
          {artist.country && <Badge>{artist.country}</Badge>}
          {artist.beginDate && (
            <span className="text-xs text-foreground-muted tabular-nums">
              {artist.beginDate}
              {artist.endDate ? ` – ${artist.endDate}` : ""}
            </span>
          )}
        </span>
      </span>

      {typeof artist.connections === "number" && (
        <span className="flex shrink-0 items-center gap-1 font-mono text-sm text-foreground-muted tabular-nums" title="Collaborations">
          <Share2 className="size-4" aria-hidden="true" />
          {artist.connections}
        </span>
      )}
    </Card>
  );
}
