# Choix techniques

Ce document justifie les choix de langages, frameworks et outils — pas seulement "ce qu'on utilise" (voir le [README](../../README.md#stack-technique--pourquoi) pour ça), mais **pourquoi**, y compris les alternatives écartées.

## Architecture générale

Trois services indépendants, orchestrés par Docker Compose :

```
Navigateur ──▶ Frontend (React/Vite, :5173) ──▶ API (FastAPI, :8000) ──▶ Neo4j (:7687)
                                                        │
                                                        ▼
                                              MusicBrainz (API publique)
```

Le frontend ne parle jamais directement à Neo4j ni à MusicBrainz : l'API est le seul point d'entrée, ce qui permet de faire évoluer le stockage ou la source de données sans toucher au client.

## Backend

### Python 3.12 + FastAPI

**Alternatives considérées** : Node/Express (le sujet laisse le langage libre), Django, Flask.

- **Django** écarté : son ORM est pensé pour du relationnel, inutile ici (aucune table SQL) ; son admin/templating n'apporte rien à une API pure.
- **Flask** écarté : pas d'async natif, pas de validation de schéma intégrée — on aurait dû ajouter Pydantic et un serveur ASGI à la main pour arriver au même résultat que FastAPI de base.
- **Node/Express** viable, mais le driver Neo4j officiel est aussi mature côté Python, et FastAPI offre trois choses utiles ici sans configuration supplémentaire : de l'**async natif** (essentiel puisque chaque import enchaîne plusieurs appels MusicBrainz sans bloquer le serveur pour les autres requêtes), la **validation automatique** des payloads via Pydantic, et une **doc interactive** générée gratuitement (`/docs`).

### Neo4j (imposé par le sujet) — et pourquoi ça reste le bon choix

Un réseau de collaborations est un graphe par nature : "qui a joué avec qui, combien de fois, en combien de sauts". En SQL, ce genre de requête (`trouver tous les artistes à distance ≤ 2 d'un artiste donné`) demande des jointures récursives ou des CTE ; en Cypher, c'est un pattern de chemin direct (`(a)-[:COLLABORATED_WITH*1..2]-(b)`). Une base documents (MongoDB) aurait posé le même problème que le SQL : soit dupliquer les relations dans chaque document, soit faire les traversées "à la main" côté application.

### Pas d'ORM — Cypher explicite

Chaque service (`services/*.py`) écrit ses requêtes Cypher directement, commentées, plutôt que de passer par un ORM/query-builder de graphe. Choix délibéré pour un projet pédagogique NoSQL : l'objectif est de manipuler et comprendre le langage de requête du graphe, pas de l'abstraire derrière une couche supplémentaire.

### httpx + tenacity pour MusicBrainz

- **httpx** plutôt que `requests` : async natif, cohérent avec FastAPI (un appel `requests` bloquant dans une route async gèlerait tout le serveur le temps de la réponse).
- **tenacity** : MusicBrainz limite à 1 req/s et répond parfois `503` sous charge. Un décorateur `@retry` déclaratif garde le code métier lisible plutôt que de parsemer des boucles `try/except` manuelles partout où on appelle MusicBrainz.

### uv

Résolution de dépendances rapide, lockfile unique (`uv.lock`) reproductible, remplace pip + venv + requirements.txt par un seul outil.

## Frontend

### React + Vite

**Alternatives considérées** : Vue, Svelte (le sujet laisse le choix libre).

React a été retenu principalement pour l'écosystème de visualisation de graphes (exemples, discussions, librairies compatibles avec d3-force) plus fourni que sur Vue/Svelte, et la familiarité de l'équipe. Vite plutôt que Create React App (déprécié) ou une config Webpack manuelle : démarrage et hot-reload quasi instantanés.

### d3-force en modules séparés, pas une lib de graphe "tout-en-un"

**Alternatives considérées** : Cytoscape.js, `react-force-graph`, `vis-network`.

Ces libs auraient fait gagner du temps de développement, mais embarquent leur propre moteur de rendu et beaucoup de fonctionnalités inutilisées ici. En n'importe que les modules d3 nécessaires (`d3-force`, `d3-selection`, `d3-drag`, `d3-zoom`) et en rendant le graphe en SVG à la main, on garde un bundle nettement plus léger et un contrôle total sur le rendu (couleurs, tailles, interactions) pour qu'il suive exactement le design system de l'appli plutôt que le thème par défaut d'une lib tierce.

### Recharts pour les stats

Choisi plutôt que Chart.js/ApexCharts car construit sur D3 avec une API de composants React déclaratifs (cohérent avec le reste de la codebase), et parce qu'il partage la même famille technique que le graphe de collaborations (D3) plutôt que d'introduire un deuxième moteur de rendu graphique.

### Découpage du bundle par route

Constat concret pendant le développement : Recharts + d3-force représentaient à eux seuls la majorité du bundle initial (~203 Ko gzip). Avec `React.lazy` par route, les pages Accueil/Recherche/Artistes/Morceaux ne chargent plus que React + Router (~78 Ko gzip) ; Recharts et d3-force ne sont téléchargés que si l'utilisateur visite réellement Graphe ou Stats.

### Tailwind CSS v4

Utilitaire, aucun CSS mort (purge automatique), zéro JavaScript supplémentaire au runtime — contrairement à une librairie de composants (MUI, Chakra) qui aurait imposé son propre système de theming en plus du design system du projet.

### lucide-react

Icônes SVG plutôt qu'emoji : rendu cohérent entre plateformes, contrôlable via les tokens de couleur de l'appli (un emoji ne peut pas hériter d'une couleur CSS), meilleure accessibilité.

## Décisions transversales

### Résilience réseau à deux niveaux

MusicBrainz étant une API publique tierce, elle peut être temporairement injoignable indépendamment du code (voir [data-analysis.md](data-analysis.md#limites) pour le détail du diagnostic). Deux filets de sécurité plutôt qu'un seul :
- **Backend** : `tenacity` retente automatiquement (3 tentatives, timeout 5s chacune — échoue en ~18s max plutôt que de faire attendre l'utilisateur plus d'une minute) les appels qui échouent.
- **Frontend** : si l'échec persiste, l'utilisateur voit une erreur explicite avec un bouton **Réessayer** plutôt qu'un chargement infini silencieux.

### Mode démo sans backend (`VITE_USE_MOCKS`)

Le frontend peut tourner isolément avec un jeu de données de démonstration intégré. Utile pour développer l'UI sans dépendre de Neo4j/MusicBrainz, et comme filet en cas de coupure réseau le jour d'une démo.

### Configuration centralisée

Un seul `.env` à la racine alimente les 3 services via `docker-compose.yml` (variables Neo4j, MusicBrainz, API, frontend) — évite d'avoir plusieurs fichiers de config qui divergent silencieusement entre eux.
