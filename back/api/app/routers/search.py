from fastapi import APIRouter, Query, HTTPException
from ..musicbrainz_client import mb_client
from ..models import ArtistSearchResult

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/artists", response_model=list[ArtistSearchResult])
async def search_artists(q: str = Query(..., min_length=1, description="Nom d'artiste à rechercher"),
                          limit: int = Query(10, ge=1, le=25)):
    try:
        results = await mb_client.search_artists(q, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur MusicBrainz: {exc}")

    return [
        ArtistSearchResult(
            mbid=a["id"],
            name=a.get("name", ""),
            country=a.get("country"),
            type=a.get("type"),
            beginDate=(a.get("life-span") or {}).get("begin"),
            disambiguation=a.get("disambiguation"),
            score=int(a.get("score", 0)) if a.get("score") else None,
        )
        for a in results
    ]
