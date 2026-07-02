import { Loader2 } from "lucide-react";

export function Spinner({ label = "Chargement…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-foreground-muted ${className}`} role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
