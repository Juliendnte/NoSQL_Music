"""
Script d'import en masse d'artistes dans MusicGraph.

Pour chaque nom d'artiste :
1. cherche via GET /api/search/artists (résultats MusicBrainz),
2. prend le meilleur résultat (score le plus élevé),
3. l'importe via POST /api/import/artists (morceaux, releases, collaborations),
4. sauvegarde un rapport JSON dans data/import_report.json.

Usage :
    uv run python scripts/import_artists.py
    uv run python scripts/import_artists.py --artists "Daft Punk" "Angèle" "PNL"
    uv run python scripts/import_artists.py --artists-file scripts/artists.txt
    uv run python scripts/import_artists.py --max-recordings 15 --max-releases 15
    uv run python scripts/import_artists.py --api-url http://localhost:8000

Le script n'a pas besoin de gérer lui-même le rate-limit MusicBrainz : l'API
le fait déjà côté serveur (1 req/s vers MusicBrainz, avec retry sur les 503).
"""
import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

DEFAULT_ARTISTS = [
    "Daft Punk",
    "Beyoncé",
    "Jay-Z",
    "Kendrick Lamar",
    "Angèle",
    "Stromae",
    "Ninho",
    "Damso",
    "SCH",
    "PNL",
]


def search_best_match(client: httpx.Client, api_url: str, name: str) -> dict | None:
    resp = client.get(f"{api_url}/api/search/artists", params={"q": name, "limit": 5})
    resp.raise_for_status()
    results = resp.json()
    if not results:
        return None
    # Le meilleur résultat = le score MusicBrainz le plus élevé (0 si absent)
    results.sort(key=lambda r: (r.get("score") or 0), reverse=True)
    return results[0]


def import_artist(client: httpx.Client, api_url: str, mbid: str, max_recordings: int, max_releases: int) -> dict:
    resp = client.post(
        f"{api_url}/api/import/artists",
        json={"mbid": mbid, "maxRecordings": max_recordings, "maxReleases": max_releases},
        timeout=120.0,  # un import peut prendre du temps (rate limit MusicBrainz)
    )
    resp.raise_for_status()
    return resp.json()


def run(artist_names: list[str], api_url: str, max_recordings: int, max_releases: int, delay: float) -> list[dict]:
    report = []

    with httpx.Client() as client:
        # Vérifie que l'API répond avant de commencer
        try:
            client.get(f"{api_url}/api/health", timeout=5.0).raise_for_status()
        except Exception as exc:
            print(f"❌ L'API n'est pas joignable sur {api_url} ({exc})")
            print("   Vérifie que 'docker compose up' tourne bien.")
            sys.exit(1)

        for i, name in enumerate(artist_names, start=1):
            print(f"\n[{i}/{len(artist_names)}] Recherche de « {name} »...")
            entry = {"query": name, "status": None}
            try:
                match = search_best_match(client, api_url, name)
                if not match:
                    print(f"  ⚠️  Aucun résultat MusicBrainz pour « {name} », on passe.")
                    entry["status"] = "not_found"
                    report.append(entry)
                    continue

                print(f"  → Match : {match['name']} ({match.get('country', '?')}) "
                      f"mbid={match['mbid']} score={match.get('score')}")
                entry["matched"] = match

                print(f"  Import en cours (max {max_recordings} morceaux, {max_releases} releases)...")
                result = import_artist(client, api_url, match["mbid"], max_recordings, max_releases)

                print(f"  ✅ Importé : {result['recordingsImported']} morceaux, "
                      f"{result['releasesImported']} releases, "
                      f"{result['collaborationsDetected']} nouvelles collaborations")
                entry["status"] = "imported"
                entry["result"] = result

            except httpx.HTTPStatusError as exc:
                detail = exc.response.text
                print(f"  ❌ Erreur HTTP {exc.response.status_code} : {detail}")
                entry["status"] = "error"
                entry["error"] = f"HTTP {exc.response.status_code}: {detail}"
            except Exception as exc:
                print(f"  ❌ Erreur inattendue : {exc}")
                entry["status"] = "error"
                entry["error"] = str(exc)

            report.append(entry)

            if delay > 0 and i < len(artist_names):
                time.sleep(delay)

    return report


def print_summary(report: list[dict]) -> None:
    imported = [r for r in report if r["status"] == "imported"]
    not_found = [r for r in report if r["status"] == "not_found"]
    errors = [r for r in report if r["status"] == "error"]

    print("\n" + "=" * 50)
    print("RÉSUMÉ")
    print("=" * 50)
    print(f"✅ Importés     : {len(imported)}/{len(report)}")
    if not_found:
        print(f"⚠️  Non trouvés  : {', '.join(r['query'] for r in not_found)}")
    if errors:
        print(f"❌ En erreur     : {', '.join(r['query'] for r in errors)}")

    if imported:
        total_recordings = sum(r["result"]["recordingsImported"] for r in imported)
        total_releases = sum(r["result"]["releasesImported"] for r in imported)
        total_collabs = sum(r["result"]["collaborationsDetected"] for r in imported)
        print(f"\nTotal : {total_recordings} morceaux, {total_releases} releases, "
              f"{total_collabs} collaborations détectées")


def main():
    parser = argparse.ArgumentParser(description="Import en masse d'artistes dans MusicGraph")
    parser.add_argument("--artists", nargs="+", help="Liste de noms d'artistes à importer")
    parser.add_argument("--artists-file", type=Path, help="Fichier texte, un nom d'artiste par ligne")
    parser.add_argument("--api-url", default="http://localhost:8000", help="URL de base de l'API")
    parser.add_argument("--max-recordings", type=int, default=25, help="Nb max de morceaux par artiste")
    parser.add_argument("--max-releases", type=int, default=25, help="Nb max de releases par artiste")
    parser.add_argument("--delay", type=float, default=0.5, help="Pause (s) entre chaque artiste")
    parser.add_argument("--output", type=Path, default=Path("data/import_report.json"),
                         help="Où sauvegarder le rapport JSON")
    args = parser.parse_args()

    if args.artists_file:
        artist_names = [line.strip() for line in args.artists_file.read_text(encoding="utf-8").splitlines() if line.strip()]
    elif args.artists:
        artist_names = args.artists
    else:
        artist_names = DEFAULT_ARTISTS

    print(f"Import de {len(artist_names)} artiste(s) vers {args.api_url}")
    report = run(artist_names, args.api_url, args.max_recordings, args.max_releases, args.delay)
    print_summary(report)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    output_data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "apiUrl": args.api_url,
        "results": report,
    }
    args.output.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n📄 Rapport sauvegardé dans {args.output}")


if __name__ == "__main__":
    main()