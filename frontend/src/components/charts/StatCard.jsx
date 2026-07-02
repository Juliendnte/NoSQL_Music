import { Card } from "../ui/Card";

export function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-accent">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-display text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        <span className="block text-sm text-foreground-muted">{label}</span>
      </span>
    </Card>
  );
}
