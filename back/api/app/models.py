"""Schémas Pydantic : définissent la forme des données échangées par l'API."""
from pydantic import BaseModel
from typing import Optional


class ArtistSearchResult(BaseModel):
    mbid: str
    name: str
    country: Optional[str] = None
    type: Optional[str] = None
    beginDate: Optional[str] = None
    disambiguation: Optional[str] = None
    score: Optional[int] = None


class Artist(BaseModel):
    mbid: str
    name: str
    type: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    beginDate: Optional[str] = None
    endDate: Optional[str] = None
    disambiguation: Optional[str] = None


class Recording(BaseModel):
    mbid: str
    title: str
    length: Optional[int] = None
    firstReleaseDate: Optional[str] = None
    popularityScore: Optional[int] = None
    source: Optional[str] = "musicbrainz"


class Release(BaseModel):
    mbid: str
    title: str
    date: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None
    releaseType: Optional[str] = None
    coverImageUrl: Optional[str] = None


class Collaboration(BaseModel):
    artist: Artist
    sharedRecordings: int
    recordingTitles: list[str] = []


class ImportArtistRequest(BaseModel):
    mbid: str
    maxRecordings: int = 25
    maxReleases: int = 25


class ImportArtistResponse(BaseModel):
    artist: Artist
    recordingsImported: int
    releasesImported: int
    collaborationsDetected: int


class GraphNode(BaseModel):
    id: str
    label: str
    type: str


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class OverviewStats(BaseModel):
    totalArtists: int
    totalRecordings: int
    totalReleases: int
    totalCollaborations: int
    totalGenres: int
