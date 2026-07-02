from ..database import run_query


def list_recordings(limit: int = 50, offset: int = 0) -> list[dict]:
    query = """
    MATCH (r:Recording)
    RETURN r { .* } AS recording
    ORDER BY r.title
    SKIP $offset LIMIT $limit
    """
    rows = run_query(query, {"limit": limit, "offset": offset})
    return [r["recording"] for r in rows]


def get_recording(mbid: str) -> dict | None:
    rows = run_query(
        "MATCH (r:Recording {mbid: $mbid}) RETURN r { .* } AS recording",
        {"mbid": mbid},
    )
    return rows[0]["recording"] if rows else None


def get_recording_artists(mbid: str) -> list[dict]:
    query = """
    MATCH (a:Artist)-[rel:PERFORMED|FEATURED_ON]->(r:Recording {mbid: $mbid})
    RETURN a { .*, role: type(rel) } AS artist
    """
    rows = run_query(query, {"mbid": mbid})
    return [r["artist"] for r in rows]


def get_recording_releases(mbid: str) -> list[dict]:
    query = """
    MATCH (r:Recording {mbid: $mbid})-[:APPEARS_ON]->(rel:Release)
    RETURN rel { .* } AS release
    """
    rows = run_query(query, {"mbid": mbid})
    return [r["release"] for r in rows]
