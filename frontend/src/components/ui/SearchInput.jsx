import { Search } from "lucide-react";

export function SearchInput({ id = "artist-search", value, onChange, placeholder = "Rechercher un artiste…", autoFocus = false }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-[15px] text-foreground placeholder:text-foreground-muted outline-none transition-colors focus-visible:border-accent"
      />
    </div>
  );
}
