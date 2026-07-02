import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Logo } from "./Logo";

export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
        </header>

        <main id="main-content" className="min-w-0 flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
