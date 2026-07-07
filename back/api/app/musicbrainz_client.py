"""
Client pour l'API publique MusicBrainz (https://musicbrainz.org/doc/MusicBrainz_API).

Règles importantes imposées par MusicBrainz qu'on respecte ici :
- max 1 requête / seconde -> on utilise un verrou asyncio + un délai.
- toujours envoyer un User-Agent identifiable (sinon l'API peut bloquer).
- toujours demander fmt=json.
"""
import asyncio
import time
import httpx
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from .config import settings


class MusicBrainzError(Exception):
    pass


class MusicBrainzClient:
    def __init__(self):
        self.base_url = settings.musicbrainz_base_url
        self.headers = {"User-Agent": settings.musicbrainz_user_agent}
        self._lock = asyncio.Lock()
        self._last_call = 0.0
        self._min_interval = settings.musicbrainz_rate_limit_seconds

    async def _throttle(self):
        """Garantit qu'on ne dépasse pas 1 requête / seconde vers MusicBrainz."""
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_call
            if elapsed < self._min_interval:
                await asyncio.sleep(self._min_interval - elapsed)
            self._last_call = time.monotonic()

    # 3 tentatives x 5s de timeout max = ~18s pire cas avant de renvoyer l'erreur
    # au lieu de laisser l'utilisateur face à un spinner pendant plus d'une minute
    # (avec 5 tentatives x 15s, un échec total prenait jusqu'à ~80s).
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(1.5),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TransportError)),
        reraise=True,
    )
    async def _get(self, path: str, params: dict) -> dict:
        await self._throttle()
        params = {**params, "fmt": "json"}
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params, headers=self.headers)
            if resp.status_code == 503:
                # MusicBrainz renvoie 503 quand on va trop vite -> on retente
                raise httpx.HTTPStatusError("rate limited", request=resp.request, response=resp)
            resp.raise_for_status()
            return resp.json()

    async def search_artists(self, name: str, limit: int = 10) -> list[dict]:
        data = await self._get("/artist", {"query": name, "limit": limit})
        return data.get("artists", [])

    async def get_artist(self, mbid: str) -> dict:
        return await self._get(
            f"/artist/{mbid}",
            {"inc": "genres+tags+area-rels+aliases"},
        )

    async def browse_recordings_by_artist(self, artist_mbid: str, limit: int = 25) -> list[dict]:
        """
        Récupère les enregistrements (morceaux) d'un artiste.
        On utilise "browse" (pas "lookup") car c'est la méthode recommandée
        par MusicBrainz pour lister les entités liées à un artiste.
        inc=artist-credits est essentiel : c'est ce qui nous permet de
        détecter les featurings / collaborations.
        NB: "releases" n'est PAS un inc valide sur un browse recording (seulement
        sur un lookup /recording/{mbid}) -> l'ajouter ici fait renvoyer un 400 par
        MusicBrainz. Le lien morceau -> release est de toute façon fait plus loin
        via browse_releases_by_artist (inc=recordings), pas ici.
        """
        data = await self._get(
            "/recording",
            {"artist": artist_mbid, "inc": "artist-credits", "limit": limit},
        )
        return data.get("recordings", [])

    async def browse_releases_by_artist(self, artist_mbid: str, limit: int = 25) -> list[dict]:
        data = await self._get(
            "/release",
            {"artist": artist_mbid, "inc": "labels+recordings+release-groups", "limit": limit},
        )
        return data.get("releases", [])

    async def get_recording(self, mbid: str) -> dict:
        return await self._get(
            f"/recording/{mbid}",
            {"inc": "artist-credits+releases+artist-rels"},
        )


mb_client = MusicBrainzClient()
