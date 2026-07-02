"""
Gestion de la connexion Neo4j.

Petit rappel Cypher pour toi vu que c'est nouveau :
- MERGE = "crée si n'existe pas, sinon récupère l'existant" -> utilisé partout
  pour éviter les doublons (on MERGE sur le mbid).
- MATCH = "cherche" (l'équivalent d'un SELECT).
- Les paramètres ($xxx) évitent les injections Cypher, comme les requêtes
  préparées en SQL. On les utilise TOUJOURS au lieu de concaténer des strings.
"""
from neo4j import GraphDatabase, Driver
from contextlib import contextmanager
from .config import settings

_driver: Driver | None = None


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


def close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


@contextmanager
def get_session():
    driver = get_driver()
    session = driver.session(database=settings.neo4j_database)
    try:
        yield session
    finally:
        session.close()


def run_query(query: str, parameters: dict | None = None) -> list[dict]:
    """
    Exécute une requête Cypher et renvoie une liste de dicts.
    C'est la fonction que tous les services vont utiliser.
    """
    with get_session() as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]


def run_write_query(query: str, parameters: dict | None = None) -> list[dict]:
    """Idem, mais dans une transaction d'écriture explicite (MERGE/CREATE/SET)."""
    with get_session() as session:
        result = session.execute_write(
            lambda tx: list(tx.run(query, parameters or {}))
        )
        return [record.data() for record in result]


# --- Contraintes d'unicité (équivalent d'une clé primaire / index unique SQL) ---
# On les crée une fois au démarrage de l'app pour garantir qu'un même mbid
# ne peut jamais correspondre à deux nœuds différents.
CONSTRAINTS = [
    "CREATE CONSTRAINT artist_mbid IF NOT EXISTS FOR (a:Artist) REQUIRE a.mbid IS UNIQUE",
    "CREATE CONSTRAINT recording_mbid IF NOT EXISTS FOR (r:Recording) REQUIRE r.mbid IS UNIQUE",
    "CREATE CONSTRAINT release_mbid IF NOT EXISTS FOR (r:Release) REQUIRE r.mbid IS UNIQUE",
    "CREATE CONSTRAINT label_mbid IF NOT EXISTS FOR (l:Label) REQUIRE l.mbid IS UNIQUE",
    "CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
    "CREATE CONSTRAINT area_mbid IF NOT EXISTS FOR (a:Area) REQUIRE a.mbid IS UNIQUE",
]


def init_schema() -> None:
    with get_session() as session:
        for stmt in CONSTRAINTS:
            session.run(stmt)
