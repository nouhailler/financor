# ─────────────────────────────────────────────────────────────────────────────
#  providers/base.py — Classe abstraite commune à tous les providers
# ─────────────────────────────────────────────────────────────────────────────
from abc import ABC, abstractmethod
from schemas import StockQuote, PriceHistory
import time
import logging

logger = logging.getLogger("financor.provider")


class BaseProvider(ABC):
    # À surcharger dans chaque provider
    name:             str = "base"
    display_name:     str = "Base Provider"
    is_premium:       bool = False
    limit_per_minute: int | None = None
    limit_per_day:    int | None = None
    priority:         int = 99   # Plus bas = priorité plus haute

    def __init__(self, api_key: str):
        self.api_key    = api_key
        self.is_enabled = bool(api_key)   # Désactivé si clé vide
        self.is_healthy = True
        self.last_error: str | None = None
        self._response_times: list[float] = []

    # ── Wrapper timing + gestion erreurs ─────────────────────────────────────
    async def fetch_with_timing(self, symbol: str) -> StockQuote:
        t0 = time.monotonic()
        try:
            quote = await self.get_quote(symbol)
            elapsed_ms = (time.monotonic() - t0) * 1000
            self._response_times = (self._response_times + [elapsed_ms])[-20:]
            self.is_healthy = True
            self.last_error = None
            logger.debug(f"[{self.name}] {symbol} → {quote.price} ({elapsed_ms:.0f}ms)")
            return quote
        except Exception as exc:
            self.is_healthy = False
            self.last_error = str(exc)
            logger.warning(f"[{self.name}] {symbol} FAILED: {exc}")
            raise

    # ── À implémenter ─────────────────────────────────────────────────────────
    @abstractmethod
    async def get_quote(self, symbol: str) -> StockQuote:
        """Retourne une cotation normalisée pour le symbole donné."""
        pass

    async def get_history(self, symbol: str, period: str) -> PriceHistory:
        """Optionnel — historique de prix. Par défaut non supporté."""
        raise NotImplementedError(f"{self.name} ne supporte pas get_history")

    # ── Propriété calculée ────────────────────────────────────────────────────
    @property
    def avg_response_ms(self) -> float:
        return sum(self._response_times) / len(self._response_times) if self._response_times else 0.0
