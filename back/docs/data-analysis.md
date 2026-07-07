# Analyse des données

Jeu de données réel importé via l'application (pas de mock) : plusieurs artistes importés indépendamment (Damso, Dua Lipa, SZA, Daft Punk...) plus les collaborateurs détectés via leurs morceaux (`FEATURED_ON` / `COLLABORATED_WITH`). Certains imports ont été interrompus en cours de route par l'instabilité réseau documentée dans [Limites](#limites), ce qui explique un mélange d'artistes pleinement importés et de nœuds "stub" partiels — situation réaliste plutôt qu'un jeu de données nettoyé artificiellement.

Pour regénérer ce rapport avec un jeu de données plus large : importer d'autres artistes (**Rechercher** → **Importer depuis MusicBrainz**, ou `POST /api/import/artists`), puis relire chaque endpoint listé ci-dessous.

## Vue d'ensemble globale

Endpoint : `GET /api/stats/overview`

| Métrique | Valeur |
|---|---|
| Artistes importés | **16** |
| Morceaux (recordings) | **95** |
| Releases | **90** |
| Collaborations détectées | **12** |
| Genres distincts | **39** |

## Top artistes les plus connectés

Endpoint : `GET /api/stats/top-artists?limit=10` — classe les artistes par nombre de collaborateurs **distincts** (pas par nombre de morceaux).

```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]->(other:Artist)
RETURN a { .* } AS artist, count(DISTINCT other) AS connections
ORDER BY connections DESC
LIMIT $limit
```

| Rang | Artiste | Connexions |
|---|---|---|
| 1 | Damso | **5** |
| 2 | Dua Lipa | 3 |
| 3 | SZA | 3 |
| 4 | Kobo | 1 |
| 5 | SCH | 1 |
| 6 | WILLOW | 1 |
| 7 | Kendrick Lamar | 1 |
| 8 | anti.negative | 1 |
| 9 | Kalash | 1 |
| 10 | Booba | 1 |

**Lecture** : trois hubs émergent (Damso, Dua Lipa, SZA) — chacun est un point de départ d'import indépendant, entouré de ses collaborateurs détectés. C'est cohérent avec la méthode d'échantillonnage : chaque artiste explicitement importé devient naturellement un hub local autour de lui, pendant que ses collaborateurs (non importés individuellement) n'affichent qu'1 connexion — celle vers le hub qui les a révélés.

## Top collaborations

Endpoint : `GET /api/stats/top-collaborations?limit=10` — paires d'artistes classées par nombre de morceaux partagés.

```cypher
MATCH (a1:Artist)-[:COLLABORATED_WITH]->(a2:Artist)
WHERE a1.mbid < a2.mbid
MATCH (a1)-[:PERFORMED|FEATURED_ON]->(shared:Recording)<-[:PERFORMED|FEATURED_ON]-(a2)
WITH a1, a2, count(DISTINCT shared) AS sharedRecordings
RETURN a1 { .* } AS artist1, a2 { .* } AS artist2, sharedRecordings
ORDER BY sharedRecordings DESC
LIMIT $limit
```

| Rang | Paire | Morceaux partagés |
|---|---|---|
| 1 | SZA × Kendrick Lamar | **9** |
| 2 | Damso × Kobo | 1 |
| 3 | Damso × Booba | 1 |
| 4 | Damso × Gazo | 1 |
| 5 | SCH × Damso | 1 |
| 6 | SZA × anti.negative | 1 |
| 7 | SZA × WILLOW | 1 |
| 8 | Jiminy Hop × Dua Lipa | 1 |
| 9 | Iggy Azalea × Dua Lipa | 1 |
| 10 | Kalash × Damso | 1 |

**Lecture** : SZA × Kendrick Lamar se détache très nettement (9 morceaux partagés) — cohérent avec la réalité : "All the Stars" (single de *Black Panther: The Album*) apparaît sur de multiples releases/rééditions dans MusicBrainz (single original, éditions de l'album, compilations), chacune comptant comme un `Recording` distinct partagé par les deux artistes. Toutes les autres paires n'ont qu'un seul morceau partagé : la donnée reflète bien la différence entre un featuring ponctuel et une collaboration répétée.

## Top morceaux (ponts entre artistes)

Endpoint : `GET /api/stats/top-bridge-recordings?limit=10` — les morceaux qui relient le plus grand nombre d'artistes **différents** (répond à la question du sujet "quels morceaux créent des ponts entre plusieurs artistes ?").

```cypher
MATCH (a:Artist)-[:PERFORMED|FEATURED_ON]->(r:Recording)
WITH r, count(DISTINCT a) AS artistCount
WHERE artistCount > 1
RETURN r { .* } AS recording, artistCount
ORDER BY artistCount DESC
LIMIT $limit
```

| Rang | Morceau | Sortie | Nb. artistes |
|---|---|---|---|
| 1 | 113 | 2017-12-01 | 2 |
| 2 | .FUMEE.ÉPAISSE. | 2022-04-29 | 2 |
| 3 | Alpha | 2024-11-15 | 2 |
| 4 | 02:00 | 2024-12-06 | 2 |
| 5 | All The Stars | 2025-02-10 | 2 |
| 6 | All the Stars | 2018-01-04 | 2 |
| 7 | 30 for 30 | 2025-02-09 | 2 |
| 8 | All The Stars | 2025-02-06 | 2 |
| 9 | 30 For 30 | 2025-02-09 | 2 |
| 10 | BODIES | 2022-07-01 | 2 |

**Lecture** : "All the Stars"/"30 for 30" apparaissent plusieurs fois avec des variantes de casse/date — ce sont des `Recording` MusicBrainz distincts (réenregistrements, éditions différentes) pour un même titre perçu. C'est une limite connue de granularité de la source (voir ci-dessous), pas un doublon côté import (chaque `mbid` est bien unique).

## Genres dominants

Endpoint : `GET /api/stats/top-genres?limit=10`.

```cypher
MATCH (a:Artist)-[:ASSOCIATED_WITH_GENRE]->(g:Genre)
RETURN g.name AS genre, count(DISTINCT a) AS artistCount
ORDER BY artistCount DESC
LIMIT $limit
```

| Rang | Genre | Artistes |
|---|---|---|
| 1 | pop | 3 |
| 2 | r&b | 3 |
| 3 | house | 2 |
| 4 | contemporary r&b | 2 |
| 5 | synth-pop | 2 |
| 6 | nu disco | 2 |
| 7 | trap | 2 |
| 8 | electronic | 2 |
| 9 | neo soul | 1 |
| 10 | hip hop | 1 |

**Lecture** : seuls les artistes pleinement importés (Damso, Dua Lipa, SZA, Daft Punk...) contribuent des genres — les collaborateurs "stub" (Kobo, SCH, Kalash, WILLOW, anti.negative, Jiminy Hop, Iggy Azalea...) n'en ont aucun tant qu'ils ne sont pas importés individuellement. Avec 39 genres distincts pour seulement une poignée d'artistes complets, MusicBrainz tague visiblement de façon assez fine et diverse (`house`, `nu disco`, `synth-pop`, `contemporary r&b` cohabitent) — illustration concrète de la limite "qualité/granularité des données" ci-dessous.

## Limites

### Limites méthodologiques (illustrées par ce jeu de données)

- **Nœuds "stub" incomplets** : observé directement ci-dessus — plusieurs artistes de ce graphe (Kobo, SCH, Kalash, WILLOW, anti.negative, Jiminy Hop, Iggy Azalea...) n'ont que `mbid` + `name`, faute d'avoir été importés individuellement. Ils comptent dans le graphe de collaborations et les classements par connexions, mais sont invisibles à toute analyse démographique (genre, pays, période d'activité) tant qu'ils ne sont pas importés à leur tour.
- **Granularité des `Recording` MusicBrainz** : un même titre perçu ("All the Stars", "30 for 30") existe souvent comme plusieurs `Recording` distincts (réenregistrements, éditions, remasters) — ce qui peut légèrement gonfler les comptages de morceaux "ponts" ou de morceaux partagés par rapport à une notion intuitive de "titre unique".
- **Biais du point de départ** : chaque hub visible (Damso, Dua Lipa, SZA) reflète un point de départ d'import choisi manuellement, pas un classement objectif de popularité ou d'influence réelle dans l'industrie musicale.
- **Détection des collaborations** : basée sur les `artist-credit` MusicBrainz (liste structurée des artistes crédités sur un morceau) — fiable pour les featurings explicitement crédités, mais ne détecte pas les collaborations informelles non créditées (ex. co-écriture sans crédit d'interprète).
- **Qualité des données MusicBrainz** : certains champs (genre, pays, dates) dépendent de contributions communautaires et sont parfois absents même pour un artiste pleinement importé — absence de donnée ≠ bug de l'import.
- **Échelle de l'échantillon** : 16 artistes ne permettent de tirer aucune conclusion générale sur l'industrie musicale — ce rapport documente la méthode et son fonctionnement réel, pas une étude de marché.

### Limites opérationnelles rencontrées pendant le développement

- **Bug corrigé** : `browse_recordings_by_artist` envoyait `inc=artist-credits+releases` à l'endpoint *browse* `/ws/2/recording`, où `releases` n'est valide qu'en *lookup* direct (`/recording/{mbid}`) — MusicBrainz renvoyait systématiquement `400 Bad Request`, ce qui faisait échouer 100 % des imports. Le paramètre n'était de toute façon jamais utilisé (le lien morceau→release se fait via `browse_releases_by_artist`) ; il a été retiré (voir `musicbrainz_client.py`).
- **Disponibilité réseau de MusicBrainz** : au-delà du bug ci-dessus, des échecs de connexion intermittents vers `musicbrainz.org` ont aussi été observés depuis notre réseau pendant le développement (diagnostiqués : DNS cohérent, certificat TLS légitime, reproductible avec plusieurs outils — donc probablement une instabilité réseau réelle, potentiellement aggravée par nos propres tests de diagnostic répétés). Conséquence visible dans ce jeu de données : plusieurs imports se sont arrêtés en cours de route (artiste + une partie de ses morceaux importés, mais pas la totalité), ce qui explique pourquoi certains artistes pleinement identifiés (Daft Punk, Kendrick Lamar) n'apparaissent pas avec toutes leurs releases attendues. Mitigations en place côté appli : retry automatique borné (3 tentatives, ~18s max) côté backend, message d'erreur explicite + bouton "Réessayer" côté frontend plutôt qu'un chargement infini.
