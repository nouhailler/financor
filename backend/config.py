# ─────────────────────────────────────────────────────────────────────────────
#  config.py — Chargement des clés API depuis .env
# ─────────────────────────────────────────────────────────────────────────────
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Clés API — laisser vide pour désactiver un provider
    FINNHUB_KEY:    str = ""
    TWELVE_KEY:     str = ""
    FMP_KEY:        str = ""
    AV_KEY:         str = ""   # Alpha Vantage

    # Comportement du router
    AUTO_FAILOVER:  bool = True
    MAX_RETRIES:    int  = 2
    TIMEOUT:        float = 5.0

    # CORS origins autorisées
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
