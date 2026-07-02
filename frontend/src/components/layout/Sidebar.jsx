import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "../../lib/nav";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface/60 px-4 py-6 lg:flex">
      <Logo />
      <nav className="flex flex-col gap-1" aria-label="Navigation principale">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 border-l-2 py-2.5 pl-2.5 pr-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-accent bg-surface-muted text-foreground"
                  : "border-transparent text-foreground-muted hover:bg-surface-muted/60 hover:text-foreground"
              }`
            }
          >
            <Icon className="size-4.5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
