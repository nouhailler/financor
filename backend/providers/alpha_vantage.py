# ─────────────────────────────────────────────────────────────────────────────
#  providers/alpha_vantage.py — Priorité 4 (25 req/jour, secours)
# ─────────────────────────────────────────────────────────────────────────────
import httpx
from datetime import datetime, timezone
from providers.base import BaseProvider
from schemas import StockQuote


class AlphaVantageProvider(BaseProvider):
    name             = "alpha_vantage"
    display_name     = "Alpha Vantage"
    limit_per_minute = None
    limit_per_day    = 25
    priority         = 4

    async def get_quote(self, symbol: str) -> StockQuote:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://www.alphavantage.co/query",
                params={
                    "function": "GLOBAL_QUOTE",
                    "symbol":   symbol,
                    "apikey":   self.api_key,
                },
            )

        if resp.status_code == 429:
            raise Exception("Rate limit exceeded (429)")
        if not resp.is_success:
            raise Exception(f"HTTP {resp.status_code}")

        d = resp.json().get("Global Quote", {})
        if not d or not d.get("05. price"):
            info = resp.json().get("Information", "")
            if info:
                raise Exception(f"AV quota: {info[:80]}")
            raise Exception(f"No data for '{symbol}'")

        price = float(d["05. price"])
        chg   = float(d.get("09. change") or 0)
        pct   = float((d.get("10. change percent") or "0%").replace("%", ""))

        return StockQuote(
            symbol         = symbol,
            price          = price,
            change         = chg,
            change_percent = pct,
            volume         = int(d.get("06. volume") or 0),
            high           = float(d.get("03. high") or 0) or None,
            low            = float(d.get("04. low") or 0) or None,
            open           = float(d.get("02. open") or 0) or None,
            prev_close     = float(d.get("08. previous close") or 0) or None,
            timestamp      = datetime.now(timezone.utc),
            provider       = self.name,
            is_delayed     = True,
            delay_minutes  = 20,
        )
