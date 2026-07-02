import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 px-1 font-display font-semibold text-foreground">
      <span className="flex size-8 items-center justify-center rounded-md bg-accent text-on-accent">
        <Share2 className="size-4.5" aria-hidden="true" />
      </span>
      <span className="text-[16px] tracking-tight">MusicGraph</span>
    </Link>
  );
}
