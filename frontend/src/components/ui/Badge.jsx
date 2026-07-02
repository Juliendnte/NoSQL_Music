const VARIANTS = {
  neutral: "border border-border text-foreground-muted",
  accent: "border border-accent bg-accent text-on-accent font-semibold",
};

export function Badge({ variant = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs uppercase tracking-wide ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
