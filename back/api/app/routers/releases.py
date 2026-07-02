from fastapi import APIRouter, HTTPException, Query
from ..services import release_service

router = APIRouter(prefix="/api/releases", tags=["releases"])


@router.get("")
def list_releases(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    return release_service.list_releases(limit=limit, offset=offset)


@router.get("/{release_id}")
def get_release(release_id: str):
    rel = release_service.get_release(release_id)
    if not rel:
        raise HTTPException(status_code=404, detail="Release non trouvée")
    return rel


@router.get("/{release_id}/recordings")
def get_release_recordings(release_id: str):
    return release_service.get_release_recordings(release_id)


@router.get("/{release_id}/artists")
def get_release_artists(release_id: str):
    return release_service.get_release_artists(release_id)
