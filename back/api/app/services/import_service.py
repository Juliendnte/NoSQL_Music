"""
Service d'import : c'est le coeur du projet.
Il va chercher les données sur MusicBrainz puis les écrit dans Neo4j
avec des MERGE (jamais de CREATE seul) pour ne jamais créer de doublon.

Rappel : un artiste est crédité sur un morceau via un objet MusicBrainz
appelé "artist-credit". Un artist-credit contient une LISTE d'artistes
(ex: "Daft Punk feat. Pharrell Williams" -> 2 artistes crédités).
C'est cette liste qui nous sert à détecter les collaborations.
"""
import re
from ..database import run_write_query
from ..musicbrainz_client import mb_client

# Mots-clés utilisés en complément pour repérer un featuring dans un titre
# (utile pour l'analyse / les stats, en plus des artist-credits MusicBrainz)
FEATURING_PATTERN = re.compile(
    r"\b(feat\.?|featuring|ft\.?|avec|with)\b", re.IGNORECASE
)


def _extract_area(artist_data: dict) -> dict | None:
    area = artist_data.get("area")
    if not area:
        return None
    return {
        "mbid": area.get("id"),
        "name": area.get("name"),
        "type": area.get("type"),
    }


def _extract_genres(artist_data: dict) -> list[str]:
    genres = [g.get("name") for g in artist_data.get("genres", []) if g.get("name")]
    # fallback sur les tags si pas de genres explicites
    if not genres:
        genres = [t.get("name") for t in artist_data.get("tags", []) if t.get("name")]
    return list(dict.fromkeys(genres))  # dédoublonne en gardant l'ordre


def _upsert_artist(mbid: str, name: str, extra: dict | None = None) -> None:
    extra = extra or {}
    query = """
    MERGE (a:Artist {mbid: $mbid})
    ON CREATE SET a.name = $name
    SET a += $extra
    """
    run_write_query(query, {"mbid": mbid, "name": name, "extra": extra})


def _link_genre(artist_mbid: str, genre_name: str) -> None:
    query = """
    MATCH (a:Artist {mbid: $mbid})
    MERGE (g:Genre {name: $genre})
    MERGE (a)-[:ASSOCIATED_WITH_GENRE]->(g)
    """
    run_write_query(query, {"mbid": artist_mbid, "genre": genre_name})


def _link_area(artist_mbid: str, area: dict) -> None:
    if not area.get("mbid"):
        return
    query = """
    MATCH (a:Artist {mbid: $mbid})
    MERGE (ar:Area {mbid: $area_mbid})
    SET ar.name = $area_name, ar.type = $area_type
    MERGE (a)-[:FROM_AREA]->(ar)
    """
    run_write_query(
        query,
        {
            "mbid": artist_mbid,
            "area_mbid": area["mbid"],
            "area_name": area.get("name"),
            "area_type": area.get("type"),
        },
    )


def _upsert_recording(recording_data: dict) -> None:
    query = """
    MERGE (r:Recording {mbid: $mbid})
    SET r.title = $title,
        r.length = $length,
        r.firstReleaseDate = $firstReleaseDate,
        r.source = 'musicbrainz'
    """
    run_write_query(
        query,
        {
            "mbid": recording_data["id"],
            "title": recording_data.get("title"),
            "length": recording_data.get("length"),
            "firstReleaseDate": recording_data.get("first-release-date"),
        },
    )


def _link_performed(artist_mbid: str, recording_mbid: str) -> None:
    query = """
    MATCH (a:Artist {mbid: $artist_mbid})
    MATCH (r:Recording {mbid: $recording_mbid})
    MERGE (a)-[:PERFORMED]->(r)
    """
    run_write_query(query, {"artist_mbid": artist_mbid, "recording_mbid": recording_mbid})


def _link_featured_and_collaboration(main_mbid: str, other_mbid: str, other_name: str, recording_mbid: str) -> bool:
    """
    Crée l'artiste invité (stub, sans détail complet), le lie au morceau
    en FEATURED_ON, et crée la relation bidirectionnelle COLLABORATED_WITH
    avec l'artiste principal.
    Renvoie True si c'est une NOUVELLE collaboration détectée.
    """
    query = """
    MERGE (other:Artist {mbid: $other_mbid})
    ON CREATE SET other.name = $other_name
    WITH other
    MATCH (r:Recording {mbid: $recording_mbid})
    MERGE (other)-[:FEATURED_ON]->(r)
    WITH other
    MATCH (main:Artist {mbid: $main_mbid})
    MERGE (main)-[c1:COLLABORATED_WITH]->(other)
    MERGE (other)-[c2:COLLABORATED_WITH]->(main)
    RETURN c1.createdAt IS NULL AS isNew
    """
    # On marque la date de création pour savoir si la relation est nouvelle
    mark_query = """
    MATCH (main:Artist {mbid: $main_mbid})-[c:COLLABORATED_WITH]->(other:Artist {mbid: $other_mbid})
    WHERE c.createdAt IS NULL
    SET c.createdAt = datetime()
    RETURN count(c) AS newCount
    """
    run_write_query(query, {
        "other_mbid": other_mbid, "other_name": other_name,
        "recording_mbid": recording_mbid, "main_mbid": main_mbid,
    })
    rows = run_write_query(mark_query, {"main_mbid": main_mbid, "other_mbid": other_mbid})
    return bool(rows and rows[0]["newCount"] > 0)


def _upsert_release(release_data: dict) -> None:
    query = """
    MERGE (rel:Release {mbid: $mbid})
    SET rel.title = $title,
        rel.date = $date,
        rel.country = $country,
        rel.status = $status,
        rel.releaseType = $releaseType
    """
    release_type = None
    rg = release_data.get("release-group") or {}
    release_type = rg.get("primary-type")
    run_write_query(
        query,
        {
            "mbid": release_data["id"],
            "title": release_data.get("title"),
            "date": release_data.get("date"),
            "country": release_data.get("country"),
            "status": release_data.get("status"),
            "releaseType": release_type,
        },
    )


def _link_appears_on(recording_mbid: str, release_mbid: str) -> None:
    query = """
    MATCH (r:Recording {mbid: $recording_mbid})
    MATCH (rel:Release {mbid: $release_mbid})
    MERGE (r)-[:APPEARS_ON]->(rel)
    """
    run_write_query(query, {"recording_mbid": recording_mbid, "release_mbid": release_mbid})


def _link_label(release_mbid: str, label_data: dict) -> None:
    if not label_data.get("id"):
        return
    query = """
    MATCH (rel:Release {mbid: $release_mbid})
    MERGE (l:Label {mbid: $label_mbid})
    SET l.name = $label_name, l.country = $label_country
    MERGE (rel)-[:RELEASED_BY]->(l)
    """
    run_write_query(
        query,
        {
            "release_mbid": release_mbid,
            "label_mbid": label_data["id"],
            "label_name": label_data.get("name"),
            "label_country": label_data.get("area", {}).get("name") if label_data.get("area") else None,
        },
    )


async def import_artist(mbid: str, max_recordings: int = 25, max_releases: int = 25) -> dict:
    # 1. Détails de l'artiste principal
    artist_data = await mb_client.get_artist(mbid)
    extra = {
        "type": artist_data.get("type"),
        "country": artist_data.get("country"),
        "gender": artist_data.get("gender"),
        "beginDate": (artist_data.get("life-span") or {}).get("begin"),
        "endDate": (artist_data.get("life-span") or {}).get("end"),
        "disambiguation": artist_data.get("disambiguation"),
    }
    extra = {k: v for k, v in extra.items() if v is not None}
    _upsert_artist(mbid, artist_data.get("name", "Unknown"), extra)

    for genre in _extract_genres(artist_data):
        _link_genre(mbid, genre)

    area = _extract_area(artist_data)
    if area:
        _link_area(mbid, area)

    # 2. Morceaux (recordings) + détection des collaborations
    recordings = await mb_client.browse_recordings_by_artist(mbid, limit=max_recordings)
    collaborations_detected = 0
    recording_ids = []

    for rec in recordings:
        _upsert_recording(rec)
        recording_ids.append(rec["id"])

        credits = rec.get("artist-credit", [])
        credited_mbids = [c.get("artist", {}).get("id") for c in credits if c.get("artist")]

        if mbid in credited_mbids:
            _link_performed(mbid, rec["id"])
        else:
            # l'artiste principal n'est pas premier crédité mais on l'a quand même
            # retrouvé via /recording?artist=mbid -> on le lie en PERFORMED
            _link_performed(mbid, rec["id"])

        for credit in credits:
            other = credit.get("artist", {})
            other_mbid = other.get("id")
            if not other_mbid or other_mbid == mbid:
                continue
            is_new = _link_featured_and_collaboration(mbid, other_mbid, other.get("name", "Unknown"), rec["id"])
            if is_new:
                collaborations_detected += 1

    # 3. Releases (albums) liées à l'artiste
    releases = await mb_client.browse_releases_by_artist(mbid, limit=max_releases)
    releases_imported = 0
    for rel in releases:
        _upsert_release(rel)
        releases_imported += 1
        for label_info in rel.get("label-info", []):
            label = label_info.get("label")
            if label:
                _link_label(rel["id"], label)
        # Lier les recordings déjà importés à cette release, si MusicBrainz
        # les mentionne dans les media/tracks de la release
        for medium in rel.get("media", []):
            for track in medium.get("tracks", []):
                rec_id = (track.get("recording") or {}).get("id")
                if rec_id and rec_id in recording_ids:
                    _link_appears_on(rec_id, rel["id"])

    updated_artist = artist_data
    return {
        "artist": {
            "mbid": mbid,
            "name": artist_data.get("name"),
            **extra,
        },
        "recordingsImported": len(recordings),
        "releasesImported": releases_imported,
        "collaborationsDetected": collaborations_detected,
    }
