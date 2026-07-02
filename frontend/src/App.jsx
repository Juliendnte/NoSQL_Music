import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Spinner } from "./components/ui/Spinner";

// Route-level code splitting: keeps the initial bundle to the app shell +
// Home, and only ships heavy deps (recharts, d3-force) for Graph/Stats.
const named = (loader, exportName) => lazy(() => loader().then((m) => ({ default: m[exportName] })));

const HomePage = named(() => import("./pages/HomePage"), "HomePage");
const SearchPage = named(() => import("./pages/SearchPage"), "SearchPage");
const ArtistsPage = named(() => import("./pages/ArtistsPage"), "ArtistsPage");
const ArtistDetailPage = named(() => import("./pages/ArtistDetailPage"), "ArtistDetailPage");
const TracksPage = named(() => import("./pages/TracksPage"), "TracksPage");
const GraphPage = named(() => import("./pages/GraphPage"), "GraphPage");
const StatsPage = named(() => import("./pages/StatsPage"), "StatsPage");
const NotFoundPage = named(() => import("./pages/NotFoundPage"), "NotFoundPage");

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<Spinner />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="search"
          element={
            <Suspense fallback={<Spinner />}>
              <SearchPage />
            </Suspense>
          }
        />
        <Route
          path="artists"
          element={
            <Suspense fallback={<Spinner />}>
              <ArtistsPage />
            </Suspense>
          }
        />
        <Route
          path="artists/:id"
          element={
            <Suspense fallback={<Spinner />}>
              <ArtistDetailPage />
            </Suspense>
          }
        />
        <Route
          path="tracks"
          element={
            <Suspense fallback={<Spinner />}>
              <TracksPage />
            </Suspense>
          }
        />
        <Route
          path="graph"
          element={
            <Suspense fallback={<Spinner />}>
              <GraphPage />
            </Suspense>
          }
        />
        <Route
          path="stats"
          element={
            <Suspense fallback={<Spinner />}>
              <StatsPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<Spinner />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
