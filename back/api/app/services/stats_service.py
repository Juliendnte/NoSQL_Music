from ..database import run_query


def overview() -> dict:
    query = """
    MATCH (a:Artist) WITH count(a) AS artists
    MATCH (r:Recording) WITH artists, count(r) AS recordings
    MATCH (rel:Release) WITH artists, recordings, count(rel) AS releases
    OPTIONAL MATCH (:Artist)-[c:COLLABORATED_WITH]->(:Artist)
    WITH artists, recordings, releases, count(c) / 2 AS collaborations
    OPTIONAL MATCH (g:Genre)
    RETURN artists AS totalArtists, recordings AS totalRecordings,
           releases AS totalReleases, collaborations AS totalCollaborations,
           count(DISTINCT g) AS totalGenres
    """
    rows = run_query(query)
    return rows[0] if rows else {
        "totalArtists": 0, "totalRecordings": 0, "totalReleases": 0,
        "totalCollaborations": 0, "totalGenres": 0,
    }


def top_artists_by_connections(limit: int = 10) -> list[dict]:
    """Les artistes les plus 'connectés' = le plus grand nombre de collaborateurs distincts."""
    query = """
    MATCH (a:Artist)-[:COLLABORATED_WITH]->(other:Artist)
    RETURN a { .* } AS artist, count(DISTINCT other) AS connections
    ORDER BY connections DESC
    LIMIT $limit
    """
    return run_query(query, {"limit": limit})


def top_collaborations(limit: int = 10) -> list[dict]:
    """Les paires d'artistes qui partagent le plus de morceaux."""
    query = """
    MATCH (a1:Artist)-[:COLLABORATED_WITH]->(a2:Artist)
    WHERE a1.mbid < a2.mbid
    MATCH (a1)-[:PERFORMED|FEATURED_ON]->(shared:Recording)<-[:PERFORMED|FEATURED_ON]-(a2)
    WITH a1, a2, count(DISTINCT shared) AS sharedRecordings
    RETURN a1 { .* } AS artist1, a2 { .* } AS artist2, sharedRecordings
    ORDER BY sharedRecordings DESC
    LIMIT $limit
    """
    return run_query(query, {"limit": limit})


def top_genres(limit: int = 10) -> list[dict]:
    query = """
    MATCH (a:Artist)-[:ASSOCIATED_WITH_GENRE]->(g:Genre)
    RETURN g.name AS genre, count(DISTINCT a) AS artistCount
    ORDER BY artistCount DESC
    LIMIT $limit
    """
    return run_query(query, {"limit": limit})


def top_recordings_as_bridges(limit: int = 10) -> list[dict]:
    """
    'Ponts' entre artistes = morceaux qui relient le plus grand nombre
    d'artistes différents (utile pour répondre à la question du sujet
    'quels morceaux créent des ponts entre plusieurs artistes ?').
    """
    query = """
    MATCH (a:Artist)-[:PERFORMED|FEATURED_ON]->(r:Recording)
    WITH r, count(DISTINCT a) AS artistCount
    WHERE artistCount > 1
    RETURN r { .* } AS recording, artistCount
    ORDER BY artistCount DESC
    LIMIT $limit
    """
    return run_query(query, {"limit": limit})
