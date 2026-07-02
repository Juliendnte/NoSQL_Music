from fastapi import APIRouter, Query
from ..services import graph_service
from ..models import GraphResponse

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=GraphResponse)
def full_graph(limit: int = Query(200, ge=1, le=1000)):
    return graph_service.get_global_graph(limit=limit)


@router.get("/artists/{artist_id}", response_model=GraphResponse)
def artist_graph(artist_id: str, limit: int = Query(200, ge=1, le=1000)):
    return graph_service.get_artist_graph(artist_id, limit=limit)


@router.get("/collaborations", response_model=GraphResponse)
def collaboration_graph(limit: int = Query(200, ge=1, le=1000)):
    return graph_service.get_collaboration_graph(limit=limit)
