from fastapi import APIRouter, HTTPException, Query
from ..services import recording_service

router = APIRouter(prefix="/api/recordings", tags=["recordings"])


@router.get("")
def list_recordings(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    return recording_service.list_recordings(limit=limit, offset=offset)


@router.get("/{recording_id}")
def get_recording(recording_id: str):
    rec = recording_service.get_recording(recording_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recording non trouvé")
    return rec


@router.get("/{recording_id}/artists")
def get_recording_artists(recording_id: str):
    return recording_service.get_recording_artists(recording_id)


@router.get("/{recording_id}/releases")
def get_recording_releases(recording_id: str):
    return recording_service.get_recording_releases(recording_id)
