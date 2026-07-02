"""
Service Graph : transforme les résultats Cypher en structure
{nodes, edges} directement exploitable par une lib de viz (ex: react-force-graph, vis.js, cytoscape).
"""
from ..database import run_query


def _row_to_graph(rows: list[dict]) -> dict:
    nodes = {}
    edges = []
    for row in rows:
        n1, r, n2 = row["n1"], row["r"], row["n2"]
        for node, labels in ((n1, row["labels1"]), (n2, row["labels2"])):
            nid = node.get("mbid") or node.get("name")
            if nid not in nodes:
                nodes[nid] = {
                    "id": nid,
                    "label": node.get("name") or node.get("title") or nid,
                    "type": labels[0] if labels else "Unknown",
                }
        edges.append({
            "source": n1.get("mbid") or n1.get("name"),
            "target": n2.get("mbid") or n2.get("name"),
            "type": r,
        })
    return {"nodes": list(nodes.values()), "edges": edges}


def get_global_graph(limit: int = 200) -> dict:
    query = """
    MATCH (n1)-[rel]->(n2)
    RETURN n1 { .* } AS n1, labels(n1) AS labels1,
           type(rel) AS r,
           n2 { .* } AS n2, labels(n2) AS labels2
    LIMIT $limit
    """
    rows = run_query(query, {"limit": limit})
    return _row_to_graph(rows)


def get_artist_graph(mbid: str, depth: int = 1, limit: int = 200) -> dict:
    """Sous-graphe centré sur un artiste : ses morceaux, releases, collaborateurs et genres."""
    query = """
    MATCH (a:Artist {mbid: $mbid})-[rel]-(n2)
    RETURN a { .* } AS n1, labels(a) AS labels1,
           type(rel) AS r,
           n2 { .* } AS n2, labels(n2) AS labels2
    LIMIT $limit
    """
    rows = run_query(query, {"mbid": mbid, "limit": limit})
    return _row_to_graph(rows)


def get_collaboration_graph(limit: int = 200) -> dict:
    query = """
    MATCH (a1:Artist)-[rel:COLLABORATED_WITH]->(a2:Artist)
    RETURN a1 { .* } AS n1, labels(a1) AS labels1,
           type(rel) AS r,
           a2 { .* } AS n2, labels(a2) AS labels2
    LIMIT $limit
    """
    rows = run_query(query, {"limit": limit})
    return _row_to_graph(rows)
