from fastapi import APIRouter, HTTPException
from ..models import ImportArtistRequest, ImportArtistResponse
from ..services import import_service

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/artists", response_model=ImportArtistResponse)
async def import_artist(payload: ImportArtistRequest):
    """
    Importe un artiste MusicBrainz dans Neo4j : crée/merge le noeud Artist,
    ses genres, son area, puis récupère ses morceaux et releases, et détecte
    les collaborations via les artist-credits MusicBrainz.
    """
    try:
        result = await import_service.import_artist(
            payload.mbid,
            max_recordings=payload.maxRecordings,
            max_releases=payload.maxReleases,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Échec de l'import: {exc}")
    return result
