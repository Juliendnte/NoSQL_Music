import { Home, Search, Users, Music2, Share2, BarChart3 } from "lucide-react";

// Shared across Sidebar (desktop) and BottomNav (mobile, kept to <=5 items per platform guidance).
export const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/search", label: "Rechercher", icon: Search },
  { to: "/artists", label: "Artistes", icon: Users },
  { to: "/tracks", label: "Morceaux", icon: Music2 },
  { to: "/graph", label: "Graphe", icon: Share2 },
  { to: "/stats", label: "Stats", icon: BarChart3 },
];

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== "/");
