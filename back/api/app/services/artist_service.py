"""
Service Artist : toute la lecture liée aux artistes stockés dans Neo4j.
Chaque fonction = une requête Cypher commentée.
"""
from ..database import run_query


def list_artists(limit: int = 50, offset: int = 0) -> list[dict]:
    query = """
    MATCH (a:Artist)
    RETURN a { .* } AS artist
    ORDER BY a.name
    SKIP $offset LIMIT $limit
    """
    rows = run_query(query, {"limit": limit, "offset": offset})
    return [r["artist"] for r in rows]


def count_artists() -> int:
    rows = run_query("MATCH (a:Artist) RETURN count(a) AS total")
    return rows[0]["total"] if rows else 0


def get_artist(mbid: str) -> dict | None:
    query = """
    MATCH (a:Artist {mbid: $mbid})
    RETURN a { .* } AS artist
    """
    rows = run_query(query, {"mbid": mbid})
    return rows[0]["artist"] if rows else None


def get_artist_recordings(mbid: str, limit: int = 50) -> list[dict]:
    """
    Morceaux où l'artiste est soit auteur principal (PERFORMED),
    soit invité (FEATURED_ON).
    """
    query = """
    MATCH (a:Artist {mbid: $mbid})-[rel:PERFORMED|FEATURED_ON]->(r:Recording)
    RETURN r { .*, role: type(rel) } AS recording
    ORDER BY r.title
    LIMIT $limit
    """
    rows = run_query(query, {"mbid": mbid, "limit": limit})
    return [r["recording"] for r in rows]


def get_artist_releases(mbid: str, limit: int = 50) -> list[dict]:
    query = """
    MATCH (a:Artist {mbid: $mbid})-[:PERFORMED|FEATURED_ON]->(:Recording)-[:APPEARS_ON]->(rel:Release)
    RETURN DISTINCT rel { .* } AS release
    ORDER BY release.date DESC
    LIMIT $limit
    """
    rows = run_query(query, {"mbid": mbid, "limit": limit})
    return [r["release"] for r in rows]


def get_artist_collaborations(mbid: str, limit: int = 50) -> list[dict]:
    """
    Pour chaque artiste collaborateur : combien de morceaux partagés
    et lesquels. Utile pour la fiche artiste et pour /api/stats/top-collaborations.
    """
    query = """
    MATCH (a:Artist {mbid: $mbid})-[:COLLABORATED_WITH]->(other:Artist)
    MATCH (a)-[:PERFORMED|FEATURED_ON]->(shared:Recording)<-[:PERFORMED|FEATURED_ON]-(other)
    WITH other, collect(DISTINCT shared.title) AS titles
    RETURN other { .* } AS artist, size(titles) AS sharedRecordings, titles AS recordingTitles
    ORDER BY sharedRecordings DESC
    LIMIT $limit
    """
    rows = run_query(query, {"mbid": mbid, "limit": limit})
    return rows


def search_artists_in_db(name: str, limit: int = 20) -> list[dict]:
    """Recherche full-text simple parmi les artistes déjà importés (utile pour /api/artists?q=)."""
    query = """
    MATCH (a:Artist)
    WHERE toLower(a.name) CONTAINS toLower($name)
    RETURN a { .* } AS artist
    ORDER BY a.name
    LIMIT $limit
    """
    rows = run_query(query, {"name": name, "limit": limit})
    return [r["artist"] for r in rows]
