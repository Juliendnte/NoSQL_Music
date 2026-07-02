from fastapi import APIRouter, Query
from ..services import stats_service
from ..models import OverviewStats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
def overview():
    return stats_service.overview()


@router.get("/top-collaborations")
def top_collaborations(limit: int = Query(10, ge=1, le=50)):
    return stats_service.top_collaborations(limit=limit)


@router.get("/top-artists")
def top_artists(limit: int = Query(10, ge=1, le=50)):
    return stats_service.top_artists_by_connections(limit=limit)


@router.get("/top-genres")
def top_genres(limit: int = Query(10, ge=1, le=50)):
    return stats_service.top_genres(limit=limit)


@router.get("/top-bridge-recordings")
def top_bridge_recordings(limit: int = Query(10, ge=1, le=50)):
    """Bonus (utile pour la partie 'analyse data') : morceaux qui relient le plus d'artistes."""
    return stats_service.top_recordings_as_bridges(limit=limit)
