import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { formatDuration, formatDate } from "../../lib/format";

const ROLE_LABELS = { PERFORMED: "Principal", FEATURED_ON: "Invité" };

export function TrackRow({ recording, artistNames, role, showLink = false }) {
  const Wrapper = showLink ? Link : "div";
  return (
    <Wrapper
      to={showLink ? `/tracks#${recording.mbid}` : undefined}
      id={recording.mbid}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 transition-colors hover:border-accent"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted text-foreground-muted">
        <Music2 className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{recording.title}</span>
        {artistNames && <span className="block truncate text-sm text-foreground-muted">{artistNames}</span>}
      </span>
      {role && ROLE_LABELS[role] && <Badge>{ROLE_LABELS[role]}</Badge>}
      <span className="shrink-0 font-mono text-sm text-foreground-muted tabular-nums">{formatDate(recording.firstReleaseDate)}</span>
      <span className="shrink-0 font-mono text-sm text-foreground-muted tabular-nums">{formatDuration(recording.length)}</span>
    </Wrapper>
  );
}
