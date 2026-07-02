import { Disc3 } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatDate } from "../../lib/format";

export function ReleaseCard({ release }) {
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-foreground-muted">
        <Disc3 className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{release.title}</span>
        <span className="mt-1 flex items-center gap-1.5">
          <Badge>{release.releaseType}</Badge>
          <span className="text-xs text-foreground-muted tabular-nums">{formatDate(release.date)}</span>
        </span>
      </span>
    </Card>
  );
}
