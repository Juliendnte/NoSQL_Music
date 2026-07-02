"""
Configuration centralisée de l'application.
Toutes les valeurs viennent des variables d'environnement (.env),
ce qui permet de ne jamais coder en dur un mot de passe ou une URL.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "changeme123"
    neo4j_database: str = "neo4j"

    # MusicBrainz
    musicbrainz_base_url: str = "https://musicbrainz.org/ws/2"
    musicbrainz_user_agent: str = "MusicGraph/1.0 (contact@example.com)"
    musicbrainz_rate_limit_seconds: float = 1.0

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
