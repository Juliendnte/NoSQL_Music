export function Card({ as: As = "div", className = "", children, ...props }) {
  return (
    <As
      className={`rounded-xl border border-border bg-surface ${className}`}
      {...props}
    >
      {children}
    </As>
  );
}
