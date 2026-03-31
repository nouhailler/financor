# ─────────────────────────────────────────────────────────────────────────────
#  providers/fmp.py — Priorité 3 (250 req/jour, données ~15min)
# ─────────────────────────────────────────────────────────────────────────────
import httpx
from datetime import datetime, timezone
from providers.base import BaseProvider
from schemas import StockQuote, PriceHistory

_FMP_INTERVAL = {"1D": "15min", "1W": "1hour", "1M": "daily", "1Y": "weekly", "ALL": "monthly"}


class FMPProvider(BaseProvider):
    name             = "fmp"
    display_name     = "Financial Modeling Prep"
    limit_per_minute = None
    limit_per_day    = 250
    priority         = 3

    async def get_quote(self, symbol: str) -> StockQuote:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://financialmodelingprep.com/api/v3/quote/{symbol}",
                params={"apikey": self.api_key},
            )

        # 403 = symbole non autorisé sur free tier (ex: indices ^GSPC)
        if resp.status_code == 403:
            raise Exception(f"Symbol '{symbol}' not available on FMP free tier (403)")
        if resp.status_code == 429:
            raise Exception("Rate limit exceeded (429)")
        if not resp.is_success:
            raise Exception(f"HTTP {resp.status_code}")

        data = resp.json()
        # FMP peut retourner [] ou {"Error Message": "..."}
        if not data:
            raise Exception(f"Empty response for '{symbol}'")
        if isinstance(data, dict) and data.get("Error Message"):
            raise Exception(data["Error Message"])
        if not isinstance(data, list) or len(data) == 0:
            raise Exception(f"No quote data for '{symbol}'")

        d = data[0]
        return StockQuote(
            symbol         = symbol,
            price          = float(d.get("price") or 0),
            change         = float(d.get("change") or 0),
            change_percent = float(d.get("changesPercentage") or 0),
            volume         = int(d.get("volume") or 0),
            high           = float(d.get("dayHigh") or 0) or None,
            low            = float(d.get("dayLow") or 0) or None,
            open           = float(d.get("open") or 0) or None,
            prev_close     = float(d.get("previousClose") or 0) or None,
            timestamp      = datetime.now(timezone.utc),
            provider       = self.name,
            is_delayed     = True,
            delay_minutes  = 15,
        )

    async def get_history(self, symbol: str, period: str) -> PriceHistory:
        interval = _FMP_INTERVAL.get(period, "daily")

        if interval in ("15min", "1hour"):
            url = f"https://financialmodelingprep.com/api/v3/historical-chart/{interval}/{symbol}"
        else:
            url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"apikey": self.api_key})

        if resp.status_code == 403:
            raise Exception(f"Symbol '{symbol}' not available on FMP free tier (403)")
        if not resp.is_success:
            raise Exception(f"HTTP {resp.status_code}")

        raw = resp.json()
        if isinstance(raw, dict) and raw.get("Error Message"):
            raise Exception(raw["Error Message"])

        if isinstance(raw, list):
            values = raw[:50]
        elif isinstance(raw, dict):
            values = raw.get("historical", [])[:50]
        else:
            raise Exception("Unexpected response format")

        if not values:
            raise Exception(f"No historical data for '{symbol}'")

        values = list(reversed(values))
        fmt = "%H:%M" if period == "1D" else "%d/%m" if period in ("1W", "1M") else "%b %y"
        labels, closes = [], []
        for v in values:
            dt_str = v.get("date", "")
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
