# MusicGraph — API Backend

Exploration des collaborations musicales à partir de MusicBrainz, stockées et interrogées dans Neo4j.

Ce dossier contient le **backend / API** (FastAPI + Neo4j). Voir le [README à la racine](../README.md) pour la présentation générale du projet (sujet, stack complète, modèle de données, démarrage via Docker Compose) — le frontend vit dans [`../frontend/`](../frontend).

## Stack

- **Backend** : Python 3.12, FastAPI, driver `neo4j` officiel
- **Gestion des dépendances** : [uv](https://docs.astral.sh/uv/)
- **Base de données** : Neo4j 5 (graphe)
- **Source de données** : API publique [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API)
- **Orchestration** : Docker Compose

## Structure

```text
./
├── api/
│   └── app/              # code de l'application (module Python "api.app")
│       ├── main.py        # point d'entrée FastAPI
│       ├── config.py
│       ├── database.py    # connexion Neo4j
│       ├── musicbrainz_client.py
│       ├── models.py
│       ├── routers/       # endpoints HTTP
│       └── services/      # logique métier / requêtes Cypher
├── data/                  # jeux de données / exports
├── docs/                  # documentation du modèle et des choix techniques
├── Dockerfile
├── pyproject.toml         # dépendances (remplace requirements.txt)
└── uv.lock                # versions verrouillées, à committer
```

Le `docker-compose.yml` et le `.env.example` vivent à la racine du repo (ils orchestrent aussi le frontend) — voir le [README principal](../README.md#démarrage-rapide-docker-compose) pour la commande de démarrage.

## Sans Docker (dev local avec uv)

```bash
# installer uv si besoin : https://docs.astral.sh/uv/getting-started/installation/
curl -LsSf https://astral.sh/uv/install.sh | sh

cp ../.env.example .env   # le template est à la racine du repo
uv sync                   # installe les dépendances dans .venv/ à partir de uv.lock

# Neo4j doit tourner (localement, ou via : docker compose up neo4j depuis la racine)
uv run uvicorn api.app.main:app --reload
```

Pour ajouter une dépendance : `uv add <paquet>` (met à jour `pyproject.toml` et `uv.lock` automatiquement).

## Modèle de données

Voir le sujet du projet pour le détail des noeuds (`Artist`, `Recording`, `Release`, `Label`, `Genre`, `Area`) et relations (`PERFORMED`, `FEATURED_ON`, `COLLABORATED_WITH`, `APPEARS_ON`, `RELEASED_BY`, `ASSOCIATED_WITH_GENRE`, `FROM_AREA`, `RELEASED_IN`).

## Endpoints principaux

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/search/artists?q=...` | Recherche d'artistes sur MusicBrainz (pas encore en base) |
| POST | `/api/import/artists` | Importe un artiste (+ morceaux, releases, collaborations) dans Neo4j |
| GET | `/api/artists` | Liste des artistes importés |
| GET | `/api/artists/{id}` | Détail d'un artiste |
| GET | `/api/artists/{id}/recordings` | Morceaux d'un artiste |
| GET | `/api/artists/{id}/releases` | Albums/releases d'un artiste |
| GET | `/api/artists/{id}/collaborations` | Collaborateurs détectés |
| GET | `/api/recordings`, `/api/recordings/{id}`, `/{id}/artists`, `/{id}/releases` | Morceaux |
| GET | `/api/releases`, `/api/releases/{id}`, `/{id}/recordings`, `/{id}/artists` | Albums |
| GET | `/api/graph`, `/api/graph/artists/{id}`, `/api/graph/collaborations` | Données pour la visualisation en graphe |
| GET | `/api/stats/overview`, `/top-artists`, `/top-collaborations`, `/top-genres`, `/top-bridge-recordings` | Analyse |

Liste complète et testable sur `/docs` une fois l'API lancée.

## Exemple d'utilisation

```bash
# 1. Chercher un artiste
curl "http://localhost:8000/api/search/artists?q=Daft%20Punk"

# 2. Importer l'artiste (avec son mbid récupéré à l'étape 1)
curl -X POST http://localhost:8000/api/import/artists \
  -H "Content-Type: application/json" \
  -d '{"mbid": "056e4f3e-d505-4dad-8ec1-d04f521cbb56", "maxRecordings": 25, "maxReleases": 25}'

# 3. Consulter les collaborations détectées
curl http://localhost:8000/api/artists/056e4f3e-d505-4dad-8ec1-d04f521cbb56/collaborations
```

## Points d'attention (qualité des données)

- Tous les noeuds ont une contrainte d'unicité sur `mbid` (créée automatiquement au démarrage) → pas de doublons possibles même en réimportant.
- Le client MusicBrainz respecte la limite d'1 requête/seconde imposée par l'API et retente automatiquement en cas de `503`.
- Les collaborations sont détectées via les `artist-credit` renvoyés par MusicBrainz (liste des artistes crédités sur un même morceau), qui est la source la plus fiable — plus robuste que du simple pattern-matching sur les titres (`feat.`, `ft.`, etc.).

## À venir

- `data/` : exports / jeux de données
- `docs/` : documentation du modèle et des choix techniques
