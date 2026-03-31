# ─────────────────────────────────────────────────────────────────────────────
#  main.py — Point d'entrée FastAPI
#
#  Lancement :
#    cd backend
#    uvicorn main:app --reload --port 8000
# ─────────────────────────────────────────────────────────────────────────────
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from router import ProviderRouter
from schemas import StockQuote, PriceHistory, ProviderStatus, RouterConfig

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("financor.main")

# ── App & state ───────────────────────────────────────────────────────────────
settings = get_settings()

router_instance: ProviderRouter | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global router_instance
    cfg = RouterConfig(
        auto_failover   = settings.AUTO_FAILOVER,
        max_retries     = settings.MAX_RETRIES,
        timeout_seconds = settings.TIMEOUT,
    )
    router_instance = ProviderRouter(
        config       = cfg,
        finnhub_key  = settings.FINNHUB_KEY,
        twelve_key   = settings.TWELVE_KEY,
        fmp_key      = settings.FMP_KEY,
        av_key       = settings.AV_KEY,
    )
    enabled = [s.name for s in router_instance.get_status() if s.is_enabled]
    logger.info(f"Financor API démarrée — providers actifs : {enabled}")
    yield


app = FastAPI(
    title       = "Financor API",
    description = "Backend multi-provider pour l'application Financor",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
#  ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    """Health check — utilisé par le frontend pour détecter le backend."""
    return {
        "status":    "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version":   "1.0.0",
    }


@app.get("/api/quote/{symbol}", response_model=StockQuote)
async def get_quote(
    symbol:   str,
    provider: str | None = Query(
        None,
        description="Forcer un provider spécifique : finnhub | twelve_data | fmp | alpha_vantage | auto",
    ),
):
    """
    Retourne la cotation d'un symbole.
    - Sans `provider` ou `provider=auto` → sélection automatique avec failover.
    - Avec `provider=finnhub` → force ce fournisseur sans fallback.
    """
    try:
        return await router_instance.get_quote(symbol.upper(), preferred=provider)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error(f"Erreur inattendue pour {symbol}: {exc}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@app.get("/api/history/{symbol}", response_model=PriceHistory)
async def get_history(
    symbol:   str,
    period:   str = Query("1M", description="1D | 1W | 1M | 1Y | ALL"),
    provider: str | None = Query(None),
):
    """Retourne l'historique de prix pour le graphique."""
    if period not in ("1D", "1W", "1M", "1Y", "ALL"):
        raise HTTPException(status_code=400, detail=f"Période invalide : {period}")
    try:
        return await router_instance.get_history(symbol.upper(), period, preferred=provider)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/api/providers/status", response_model=list[ProviderStatus])
async def get_providers_status():
    """Retourne l'état de santé de chaque provider (pour le dashboard de config)."""
    return router_instance.get_status()


@app.patch("/api/providers/config")
async def update_config(config: RouterConfig):
    """Permet au frontend de changer la config du router (preferred provider, etc.)."""
    router_instance.update_config(config)
    return {"ok": True, "config": config}


# ── Static frontend (mode production) ────────────────────────────────────────
import os as _os

# Priorité 1 : variable d'environnement (lanceur)
# Priorité 2 : chemin standard d'installation Debian
_static_dir = (
    _os.environ.get("FINANCOR_STATIC_DIR", "")
    or "/usr/share/financor/frontend/dist"
)

if not _os.path.isfile(_os.path.join(_static_dir, "index.html")):
    # En dev : pas de dist → uniquement l'API est exposée
    logger.info("Frontend non servi (dist absent) — mode API seul")
else:
    from fastapi.staticfiles import StaticFiles as _SF
    from fastapi.responses import FileResponse as _FR

    _index  = _os.path.join(_static_dir, "index.html")
    _assets = _os.path.join(_static_dir, "assets")

    if _os.path.isdir(_assets):
        app.mount("/assets", _SF(directory=_assets), name="static_assets")

    # Route explicite pour GET / (le path converter ne capture pas le chemin vide)
    @app.get("/", include_in_schema=False)
    async def serve_root():
        return _FR(_index)

    # Catch-all : toutes les routes React Router → index.html
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        fp = _os.path.join(_static_dir, full_path)
        if _os.path.isfile(fp):
            return _FR(fp)
        return _FR(_index)

    logger.info(f"Mode production : frontend servi depuis {_static_dir}")


# ── Run direct ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("""
╔══════════════════════════════════════════════════════╗
║          Financor API — Backend Multi-Provider       ║
║  http://localhost:8000                               ║
║  Docs Swagger : http://localhost:8000/docs           ║
╚══════════════════════════════════════════════════════╝
    """)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
