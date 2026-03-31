# ─────────────────────────────────────────────────────────────────────────────
#  providers/finnhub.py — Priorité 1 (temps réel US, 60 req/min gratuit)
# ─────────────────────────────────────────────────────────────────────────────
import httpx
import time
from datetime import datetime, timezone
from providers.base import BaseProvider
from schemas import StockQuote, PriceHistory

_RESOLUTION = {"1D": "15", "1W": "60", "1M": "D", "1Y": "W", "ALL": "M"}
_DAYS_BACK  = {"1D": 1,    "1W": 7,   "1M": 30, "1Y": 365, "ALL": 1825}


class FinnhubProvider(BaseProvider):
    name             = "finnhub"
    display_name     = "Finnhub"
    limit_per_minute = 60
    limit_per_day    = None
    priority         = 1

    async def get_quote(self, symbol: str) -> StockQuote:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://finnhub.io/api/v1/quote",
                params={"symbol": symbol, "token": self.api_key},
            )

        if resp.status_code == 429:
            raise Exception("Rate limit exceeded (429)")
        if resp.status_code == 401:
            raise Exception("Invalid API key (401)")
        if not resp.is_success:
            raise Exception(f"HTTP {resp.status_code}")

        d = resp.json()
        # c=0 signifie "pas de données" pour ce symbole sur Finnhub free
        price = d.get("c")
        if not price:
            raise Exception(f"No data for symbol '{symbol}' (price=0 or null)")

        return StockQuote(
            symbol         = symbol,
            price          = float(price),
            change         = float(d.get("d") or 0),
            change_percent = float(d.get("dp") or 0),
            volume         = int(d.get("v") or 0),
            high           = float(d.get("h") or 0) or None,
            low            = float(d.get("l") or 0) or None,
            open           = float(d.get("o") or 0) or None,
            prev_close     = float(d.get("pc") or 0) or None,
            timestamp      = datetime.now(timezone.utc),
            provider       = self.name,
            is_delayed     = False,
            delay_minutes  = 0,
        )

    async def get_history(self, symbol: str, period: str) -> PriceHistory:
        now  = int(time.time())
        days = _DAYS_BACK.get(period, 30)
        frm  = now - days * 86400
        res  = _RESOLUTION.get(period, "D")

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://finnhub.io/api/v1/stock/candle",
                params={"symbol": symbol, "resolution": res,
                        "from": frm, "to": now, "token": self.api_key},
            )

        # 403 = endpoint candle non disponible sur free tier pour ce symbole
        if resp.status_code == 403:
            raise Exception(f"Candle endpoint not available for '{symbol}' on free tier (403)")
        if not resp.is_success:
            raise Exception(f"Candle HTTP {resp.status_code}")

        d = resp.json()
        if d.get("s") != "ok" or not d.get("c"):
            raise Exception(f"No candle data for '{symbol}'")

        fmt = "%H:%M" if period == "1D" else "%d/%m" if period in ("1W", "1M") else "%b %y"
        labels = [
            datetime.fromtimestamp(t, tz=timezone.utc).strftime(fmt)
            for t in d["t"]
        ]

        return PriceHistory(
            symbol    = symbol,
            period    = period,
            labels    = labels,
            closes    = [round(float(v), 4) for v in d["c"]],
            provider  = self.name,
            timestamp = datetime.now(timezone.utc),
        )
