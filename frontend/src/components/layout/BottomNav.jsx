import { NavLink } from "react-router-dom";
import { BOTTOM_NAV_ITEMS } from "../../lib/nav";

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {BOTTOM_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 py-2 text-[11px] font-medium ${
              isActive ? "border-accent text-accent" : "border-transparent text-foreground-muted"
            }`
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
