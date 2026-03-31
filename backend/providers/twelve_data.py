# ─────────────────────────────────────────────────────────────────────────────
#  providers/twelve_data.py — Priorité 2 (8 req/min, données ~15min)
# ─────────────────────────────────────────────────────────────────────────────
import httpx
from datetime import datetime, timezone
from providers.base import BaseProvider
from schemas import StockQuote, PriceHistory

_INTERVAL    = {"1D": "15min", "1W": "1h",   "1M": "1day", "1Y": "1week", "ALL": "1month"}
_OUTPUT_SIZE = {"1D": 28,      "1W": 40,     "1M": 30,     "1Y": 52,      "ALL": 60}


class TwelveDataProvider(BaseProvider):
    name             = "twelve_data"
    display_name     = "Twelve Data"
    limit_per_minute = 8
    limit_per_day    = None
    priority         = 2

    async def get_quote(self, symbol: str) -> StockQuote:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.twelvedata.com/quote",
                params={"symbol": symbol, "apikey": self.api_key},
            )

        if resp.status_code == 429:
            raise Exception("Rate limit exceeded (429)")
        if not resp.is_success:
            raise Exception(f"HTTP {resp.status_code}")

        d = resp.json()

        # Twelve Data retourne {"code": 400, "message": "..."} pour les erreurs
        if d.get("code") or d.get("status") == "error":
            raise Exception(d.get("message", "API error"))

        # Le champ prix peut être "close" ou "price" selon le mode de marché
        raw_price = d.get("close") or d.get("price") or d.get("previous_close")
        if not raw_price:
            raise Exception(f"No price data for '{symbol}'")

        price     = float(raw_price)
        prev      = float(d.get("previous_close") or price)
        chg       = round(price - prev, 4)
        pct       = round((chg / prev * 100) if prev else 0, 4)

        return StockQuote(
            symbol         = symbol,
            price          = price,
            change         = chg,
            change_percent = pct,
            volume         = int(d.get("volume") or 0),
            high           = float(d.get("high") or 0) or None,
            low            = float(d.get("low") or 0) or None,
            open           = float(d.get("open") or 0) or None,
            prev_close     = prev,
            timestamp      = datetime.now(timezone.utc),
            provider       = self.name,
            is_delayed     = True,
            delay_minutes  = 15,
        )

    async def get_history(self, symbol: str, period: str) -> PriceHistory:
        interval    = _INTERVAL.get(period, "1day")
        output_size = _OUTPUT_SIZE.get(period, 30)

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.twelvedata.com/time_series",
                params={
                    "symbol":     symbol,
                    "interval":   interval,
                    "outputsize": output_size,
                    "apikey":     self.api_key,
                },
            )

        if not resp.is_success:
            raise Exception(f"HTTP {resp.status_code}")

        d = resp.json()
        if d.get("code") or d.get("status") == "error":
            raise Exception(d.get("message", "API error"))

        values = list(reversed(d.get("values", [])))
        if not values:
            raise Exception(f"No time series data for '{symbol}'")

        fmt = "%H:%M" if period == "1D" else "%d/%m" if period in ("1W", "1M") else "%b %y"
        labels, closes = [], []
        for v in values:
            dt_str = v.get("datetime", "")
            try:
                dt = datetime.fromisoformat(dt_str.replace(" ", "T"))
                labels.append(dt.strftime(fmt))
            except Exception:
                labels.append(dt_str[:10])
            closes.append(round(float(v.get("close", 0)), 4))

        return PriceHistory(
            symbol    = symbol,
            period    = period,
            labels    = labels,
            closes    = closes,
            provider  = self.name,
            timestamp = datetime.now(timezone.utc),
        )
