from ..database import run_query


def list_releases(limit: int = 50, offset: int = 0) -> list[dict]:
    query = """
    MATCH (rel:Release)
    RETURN rel { .* } AS release
    ORDER BY rel.date DESC
    SKIP $offset LIMIT $limit
    """
    rows = run_query(query, {"limit": limit, "offset": offset})
    return [r["release"] for r in rows]


def get_release(mbid: str) -> dict | None:
    rows = run_query(
        "MATCH (rel:Release {mbid: $mbid}) RETURN rel { .* } AS release",
        {"mbid": mbid},
    )
    return rows[0]["release"] if rows else None


def get_release_recordings(mbid: str) -> list[dict]:
    query = """
    MATCH (r:Recording)-[:APPEARS_ON]->(rel:Release {mbid: $mbid})
    RETURN r { .* } AS recording
    """
    rows = run_query(query, {"mbid": mbid})
    return [r["recording"] for r in rows]


def get_release_artists(mbid: str) -> list[dict]:
    query = """
    MATCH (a:Artist)-[:PERFORMED|FEATURED_ON]->(:Recording)-[:APPEARS_ON]->(rel:Release {mbid: $mbid})
    RETURN DISTINCT a { .* } AS artist
    """
    rows = run_query(query, {"mbid": mbid})
    return [r["artist"] for r in rows]
