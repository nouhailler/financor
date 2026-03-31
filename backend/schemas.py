# ─────────────────────────────────────────────────────────────────────────────
#  schemas.py — Modèles Pydantic partagés (Backend ↔ Frontend)
# ─────────────────────────────────────────────────────────────────────────────
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ── Cotation standard ─────────────────────────────────────────────────────────
class StockQuote(BaseModel):
    symbol:          str
    price:           float
    change:          float
    change_percent:  float
    volume:          int
    high:            Optional[float] = None
    low:             Optional[float] = None
    open:            Optional[float] = None
    prev_close:      Optional[float] = None
    timestamp:       datetime           # Toujours présent — clé UX fraîcheur
    provider:        str                # "finnhub" | "twelve_data" | "fmp" | "alpha_vantage" | "mock"
    is_delayed:      bool = False       # True si données différées
    delay_minutes:   int  = 0
    currency:        str  = "USD"


# ── État d'un provider ────────────────────────────────────────────────────────
class ProviderStatus(BaseModel):
    name:                  str
    display_name:          str
    is_healthy:            bool
    is_enabled:            bool          # False si clé non configurée
    circuit_state:         str           # "closed" | "open" | "half-open"
    requests_today:        int
    requests_this_minute:  int
    limit_per_minute:      Optional[int]
    limit_per_day:         Optional[int]
    last_error:            Optional[str] = None
    avg_response_ms:       float = 0.0
    priority:              int           # 1 = premier essayé


# ── Config router (lecture / écriture) ───────────────────────────────────────
class RouterConfig(BaseModel):
    auto_failover:      bool = True
    max_retries:        int  = 2
    timeout_seconds:    float = 5.0
    preferred_provider: Optional[str] = None   # None = auto


# ── Historique (sparkline ou chart) ──────────────────────────────────────────
class PriceHistory(BaseModel):
    symbol:    str
    period:    str          # "1D" | "1W" | "1M" | "1Y"
    labels:    list[str]
    closes:    list[float]
    provider:  str
    timestamp: datetime
    is_mock:   bool = False  # True si données générées localement (fallback)
