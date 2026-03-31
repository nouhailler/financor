// ─────────────────────────────────────────────────────────────────────────────
//  components/DataSourceBar.jsx
//  Barre de statut discrète affichant la source et la fraîcheur des données
// ─────────────────────────────────────────────────────────────────────────────
import { computeFreshness } from '../hooks/useStockData.js'

const PROVIDER_NAMES = {
  finnhub:       'Finnhub',
  twelve_data:   'Twelve Data',
  fmp:           'Financial Modeling Prep',
  alpha_vantage: 'Alpha Vantage',
  mock:          'Données simulées',
}

const FRESHNESS_BADGE = {
  fresh:   'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  delayed: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  stale:   'bg-red-500/10    text-red-500    border-red-500/20',
  unknown: 'bg-stone-800     text-stone-500  border-stone-700',
}

/**
 * @param {object|null} quote        Objet StockQuote retourné par le backend (ou null)
 * @param {boolean}     backendOnline
 * @param {string}      provider     Provider actif sélectionné par l'utilisateur
 * @param {function}    onRefresh    Callback pour rafraîchir manuellement
 */
export default function DataSourceBar({ quote, backendOnline, provider = 'auto', onRefresh }) {
  // ── Si le backend est hors ligne ───────────────────────────────────────────
  if (!backendOnline) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-stone-900/60 border border-stone-800/60 rounded-lg text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-600 flex-shrink-0" />
        <span className="text-stone-500">
          Backend non connecté — données simulées affichées
        </span>
        <a
          href="/settings"
          className="ml-auto text-primary hover:underline flex-shrink-0"
        >
          Configurer →
        </a>
      </div>
    )
  }

  // ── En attente de la première donnée ──────────────────────────────────────
  if (!quote) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-stone-900/60 border border-stone-800/60 rounded-lg text-xs text-stone-500">
        <span className="w-3 h-3 border border-stone-600 border-t-primary rounded-full animate-spin" />
        Chargement des données…
      </div>
    )
  }

  const freshness     = computeFreshness(quote.timestamp, quote.is_delayed, quote.delay_minutes)
  const providerLabel = PROVIDER_NAMES[quote.provider] ?? quote.provider
  const badgeClass    = FRESHNESS_BADGE[freshness.level] ?? FRESHNESS_BADGE.unknown

  const tsFormatted = quote.timestamp
    ? new Date(quote.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-stone-900/60 border border-stone-800/60
                    rounded-lg text-xs flex-wrap">

      {/* Dot + source */}
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${freshness.dot}`} />
        <span className="text-stone-400">
          Données via{' '}
          <span className="font-bold text-stone-200">{providerLabel}</span>
          {quote.is_delayed && (
            <span className="text-amber-500 ml-1">(différées {quote.delay_minutes} min)</span>
          )}
        </span>
      </div>

      {/* Séparateur */}
      <span className="text-stone-700 hidden sm:block">·</span>

      {/* Timestamp */}
      <span className="text-stone-500 hidden sm:block">
        Mis à jour à {tsFormatted}
      </span>

      {/* Badge fraîcheur */}
      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
        {freshness.label}
      </span>

      {/* Provider sélectionné si override */}
      {provider && provider !== 'auto' && (
        <span className="text-[10px] text-stone-600 uppercase tracking-wider">
          Forcé : {provider}
        </span>
      )}

      {/* Bouton rafraîchir */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          title="Rafraîchir"
          className="ml-auto text-stone-500 hover:text-primary transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
        </button>
      )}
    </div>
  )
}
