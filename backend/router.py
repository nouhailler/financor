# ─────────────────────────────────────────────────────────────────────────────
#  router.py — Smart Router v2 : Circuit Breaker par provider + symboles proxy
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import logging
from datetime import datetime, timezone, timedelta

from schemas import StockQuote, PriceHistory, ProviderStatus, RouterConfig
from providers.finnhub       import FinnhubProvider
from providers.twelve_data   import TwelveDataProvider
from providers.fmp           import FMPProvider
from providers.alpha_vantage import AlphaVantageProvider

logger = logging.getLogger("financor.router")

# ─────────────────────────────────────────────────────────────────────────────
#  Table de correspondance symboles non-supportés → symboles proxy
#
#  Les APIs free ne supportent PAS les symboles Yahoo Finance pour indices/futures.
#  On utilise des ETF liquides comme proxy :
#    ^GSPC  → SPY   (S&P 500 ETF,  corrélation >0.999)
#    ^IXIC  → QQQ   (Nasdaq-100 ETF, corrélation >0.998)
#    CL=F   → USO   (WTI Oil ETF)
#    GC=F   → GLD   (Gold ETF)
#
#  Le frontend affiche le nom original (S&P 500, etc.), pas le proxy.
# ─────────────────────────────────────────────────────────────────────────────
SYMBOL_PROXY: dict[str, str] = {
    "^GSPC": "SPY",
    "^IXIC": "QQQ",
    "CL=F":  "USO",
    "GC=F":  "GLD",
}

# Facteurs de conversion ETF → valeur de l'indice (pour l'affichage)
# SPY ≈ S&P/10, QQQ ≈ NASDAQ/40, USO ≈ WTI brut, GLD ≈ Or/10
# Note : on n'applique PAS de conversion — on affiche les prix ETF tels quels
# avec un badge clair "via ETF proxy". Les variations % restent exactes.


def resolve_symbol(symbol: str) -> tuple[str, bool]:
    """Retourne (symbole_api, is_proxy). is_proxy=True si substitution."""
    proxy = SYMBOL_PROXY.get(symbol.upper())
    if proxy:
        return proxy, True
    return symbol, False


# ─────────────────────────────────────────────────────────────────────────────
#  Circuit Breaker — par provider, seuil relevé à 5 pour éviter faux positifs
# ─────────────────────────────────────────────────────────────────────────────
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout  = recovery_timeout
        self.failures          = 0
        self.last_failure_time: datetime | None = None
        self.state             = "closed"

    def record_success(self):
        self.failures = 0
        self.state    = "closed"

    def record_failure(self):
        self.failures += 1
        self.last_failure_time = datetime.now(timezone.utc)
        if self.failures >= self.failure_threshold:
            self.state = "open"
            logger.warning(f"Circuit OPEN after {self.failures} failures")

    def can_execute(self) -> bool:
        if self.state == "closed":
            return True
        if self.state == "open":
            if (self.last_failure_time and
                    datetime.now(timezone.utc) - self.last_failure_time
                    > timedelta(seconds=self.recovery_timeout)):
                self.state = "half-open"
                logger.info("Circuit HALF-OPEN — testing provider")
                return True
            return False
        return True  # half-open


# ─────────────────────────────────────────────────────────────────────────────
#  Rate Limit Tracker
# ─────────────────────────────────────────────────────────────────────────────
class RateLimitTracker:
    def __init__(self):
        self._log: list[datetime] = []

    def record(self):
        now = datetime.now(timezone.utc)
        self._log.append(now)
        cutoff = now - timedelta(hours=24)
        self._log = [t for t in self._log if t > cutoff]

    def count_last_minute(self) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
        return sum(1 for t in self._log if t > cutoff)

    def count_today(self) -> int:
        cutoff = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        return sum(1 for t in self._log if t > cutoff)

    def is_rate_limited(self, limit_per_minute: int | None, limit_per_day: int | None) -> bool:
        if limit_per_minute and self.count_last_minute() >= limit_per_minute:
            return True
        if limit_per_day and self.count_today() >= limit_per_day:
            return True
        return False


# ─────────────────────────────────────────────────────────────────────────────
#  ProviderRouter
# ─────────────────────────────────────────────────────────────────────────────
class ProviderRouter:
    def __init__(self, config: RouterConfig,
                 finnhub_key: str, twelve_key: str, fmp_key: str, av_key: str):
        self.config = config
        self.providers = [
            FinnhubProvider(finnhub_key),
            TwelveDataProvider(twelve_key),
            FMPProvider(fmp_key),
            AlphaVantageProvider(av_key),
        ]
        self.circuit_breakers = {p.name: CircuitBreaker() for p in self.providers}
        self.rate_trackers    = {p.name: RateLimitTracker() for p in self.providers}
        logger.info(
            f"Router v2 initialisé — providers actifs : "
            f"{[p.name for p in self.providers if p.is_enabled]}"
        )

    # ── API publique ──────────────────────────────────────────────────────────

    async def get_quote(self, symbol: str, preferred: str | None = None) -> StockQuote:
        """
        Récupère une cotation.
        - Traduit automatiquement les symboles non-supportés via SYMBOL_PROXY.
        - Retourne toujours le symbole ORIGINAL dans la réponse (pas le proxy).
        """
        api_symbol, is_proxy = resolve_symbol(symbol)

        if preferred and preferred != "auto":
            provider = self._find_provider(preferred)
            if not provider:
                raise ValueError(f"Provider '{preferred}' inconnu")
            quote = await self._try_provider(provider, api_symbol, retry=False)
            quote.symbol = symbol          # Remettre le symbole original
            if is_proxy:
                quote.is_delayed = True    # ETF proxy = légèrement différé
            return quote

        candidates = self._get_available_providers()
        if not candidates:
            raise RuntimeError("Aucun fournisseur disponible")

        last_exc: Exception | None = None
        for provider in candidates:
            try:
                quote = await self._try_provider(provider, api_symbol, retry=True)
                quote.symbol = symbol
                if is_proxy:
                    quote.is_delayed = True
                return quote
            except Exception as exc:
                last_exc = exc
                logger.info(f"Failover depuis {provider.name} ({symbol}): {exc}")
                continue

        raise RuntimeError(
            f"Tous les fournisseurs ont échoué pour '{symbol}' "
            f"(proxy: '{api_symbol}'). Dernière erreur : {last_exc}"
        )

    async def get_history(self, symbol: str, period: str,
                          preferred: str | None = None) -> PriceHistory:
        """Récupère l'historique. Utilise le proxy si nécessaire."""
        api_symbol, is_proxy = resolve_symbol(symbol)

        candidates = (
            [self._find_provider(preferred)]
            if preferred and preferred != "auto"
            else self._get_available_providers()
        )

        last_exc = None
        for provider in (c for c in candidates if c):
            try:
                hist = await provider.get_history(api_symbol, period)
                self.rate_trackers[provider.name].record()
                hist.symbol  = symbol      # Symbole original
                hist.is_mock = False
                return hist
            except NotImplementedError:
                continue
            except Exception as exc:
                last_exc = exc
                logger.debug(f"[{provider.name}] history {symbol} failed: {exc}")
                continue

        raise RuntimeError(
            f"Historique indisponible pour '{symbol}/{period}' "
            f"(proxy: '{api_symbol}'). {last_exc}"
        )

    def get_status(self) -> list[ProviderStatus]:
        statuses = []
        for p in self.providers:
            cb = self.circuit_breakers[p.name]
            rt = self.rate_trackers[p.name]
            statuses.append(ProviderStatus(
                name                 = p.name,
                display_name         = p.display_name,
                is_healthy           = p.is_healthy and cb.can_execute(),
                is_enabled           = p.is_enabled,
                circuit_state        = cb.state,
                requests_today       = rt.count_today(),
                requests_this_minute = rt.count_last_minute(),
                limit_per_minute     = p.limit_per_minute,
                limit_per_day        = p.limit_per_day,
                last_error           = p.last_error,
                avg_response_ms      = p.avg_response_ms,
                priority             = p.priority,
            ))
        return statuses

    def update_config(self, new_config: RouterConfig):
        self.config = new_config

    # ── Logique interne ───────────────────────────────────────────────────────

    def _find_provider(self, name: str):
        return next((p for p in self.providers if p.name == name), None)

    def _get_available_providers(self):
        available = []
        for p in self.providers:
            if not p.is_enabled:
                continue
            cb = self.circuit_breakers[p.name]
            rt = self.rate_trackers[p.name]
            if not cb.can_execute():
                continue
            if rt.is_rate_limited(p.limit_per_minute, p.limit_per_day):
                logger.debug(f"{p.name} ignoré (rate limit)")
                continue
            available.append(p)
        return sorted(available, key=lambda p: (p.priority, p.avg_response_ms))

    async def _try_provider(self, provider, symbol: str, retry: bool) -> StockQuote:
        cb = self.circuit_breakers[provider.name]
        rt = self.rate_trackers[provider.name]
        attempts = self.config.max_retries if retry else 1

        for attempt in range(attempts):
            try:
                quote = await provider.fetch_with_timing(symbol)
                cb.record_success()
                rt.record()
                return quote
            except Exception as exc:
                cb.record_failure()
                if attempt < attempts - 1:
                    wait = (2 ** attempt) * 0.4
                    await asyncio.sleep(wait)
                else:
                    raise exc
