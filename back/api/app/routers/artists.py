from fastapi import APIRouter, HTTPException, Query
from ..services import artist_service

router = APIRouter(prefix="/api/artists", tags=["artists"])


@router.get("")
def list_artists(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    return {
        "items": artist_service.list_artists(limit=limit, offset=offset),
        "total": artist_service.count_artists(),
        "limit": limit,
        "offset": offset,
    }


@router.get("/{artist_id}")
def get_artist(artist_id: str):
    artist = artist_service.get_artist(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artiste non trouvé en base. Importe-le d'abord via POST /api/import/artists")
    return artist


@router.get("/{artist_id}/recordings")
def get_artist_recordings(artist_id: str, limit: int = Query(50, ge=1, le=200)):
    return artist_service.get_artist_recordings(artist_id, limit=limit)


@router.get("/{artist_id}/releases")
def get_artist_releases(artist_id: str, limit: int = Query(50, ge=1, le=200)):
    return artist_service.get_artist_releases(artist_id, limit=limit)


@router.get("/{artist_id}/collaborations")
def get_artist_collaborations(artist_id: str, limit: int = Query(50, ge=1, le=200)):
    return artist_service.get_artist_collaborations(artist_id, limit=limit)
