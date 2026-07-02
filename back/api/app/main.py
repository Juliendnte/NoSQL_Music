from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import init_schema, close_driver
from .routers import search, artists, importer, recordings, releases, graph, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Au démarrage : crée les contraintes d'unicité Neo4j si elles n'existent pas
    init_schema()
    yield
    close_driver()


app = FastAPI(
    title="MusicGraph API",
    description="API d'exploration des collaborations musicales (MusicBrainz + Neo4j)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(artists.router)
app.include_router(importer.router)
app.include_router(recordings.router)
app.include_router(releases.router)
app.include_router(graph.router)
app.include_router(stats.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
