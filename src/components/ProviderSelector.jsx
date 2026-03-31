// ─────────────────────────────────────────────────────────────────────────────
//  components/ProviderSelector.jsx
//  Sélecteur de fournisseur de données avec indicateurs de santé
// ─────────────────────────────────────────────────────────────────────────────
import { useProviderStatus } from '../hooks/useProviderStatus.js'

const CIRCUIT_LABELS = {
  closed:    { text: 'OK',         color: 'text-emerald-500' },
  'half-open': { text: 'Test',     color: 'text-amber-400'  },
  open:      { text: 'En panne',   color: 'text-red-500'    },
}

const PROVIDER_ICONS = {
  finnhub:       '⚡',
  twelve_data:   '📊',
  fmp:           '📈',
  alpha_vantage: '🔬',
}

/**
 * @param {string}   value          Provider actif : "auto" | "finnhub" | ...
 * @param {function} onChange       Callback quand l'utilisateur change
 * @param {boolean}  compact        Mode compact (header) vs étendu (settings)
 */
export default function ProviderSelector({ value = 'auto', onChange, compact = false }) {
  const { providers, loading, backendOnline } = useProviderStatus()

  // ── Mode compact : juste un select + dots ─────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Indicateurs de santé rapides */}
        {!loading && backendOnline && providers.map(p => (
          <div
            key={p.name}
            title={`${p.display_name}: ${p.is_enabled ? (p.is_healthy ? 'OK' : 'Erreur') : 'Non configuré'}`}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              !p.is_enabled ? 'bg-stone-700' :
              p.is_healthy  ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
        ))}

        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-stone-900 border border-stone-700 text-stone-300 text-xs rounded-lg
                     px-2 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer"
        >
          <option value="auto">⚡ Auto</option>
          {providers.filter(p => p.is_enabled).map(p => (
            <option key={p.name} value={p.name}>
              {PROVIDER_ICONS[p.name] || '•'} {p.display_name}
              {!p.is_healthy ? ' ✗' : ''}
            </option>
          ))}
          {!backendOnline && (
            <option disabled value="__offline">Backend hors ligne</option>
          )}
        </select>
      </div>
    )
  }

  // ── Mode étendu : panneau complet (pour Settings) ─────────────────────────
  return (
    <div className="space-y-3">
      {/* Sélecteur principal */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
          Fournisseur de données
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-sm rounded-lg
                     px-3 py-2.5 outline-none focus:border-primary/50 transition-all cursor-pointer"
        >
          <option value="auto">⚡ Automatique (recommandé)</option>
          {providers.filter(p => p.is_enabled).map(p => (
            <option key={p.name} value={p.name} disabled={!p.is_healthy}>
              {PROVIDER_ICONS[p.name]} {p.display_name}
              {!p.is_healthy ? ' — Indisponible' : ''}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-stone-600 mt-1.5">
          En mode Automatique, le système bascule vers le prochain fournisseur disponible en cas d'erreur.
        </p>
      </div>

      {/* Tableau d'état */}
      {loading ? (
        <div className="text-xs text-stone-500 py-2">Chargement des statuts…</div>
      ) : !backendOnline ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-xs text-red-400">
            Backend Python non détecté — données simulées uniquement
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map(p => (
            <ProviderRow key={p.name} provider={p} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Ligne de statut d'un provider ─────────────────────────────────────────────
function ProviderRow({ provider: p }) {
  const circuit = CIRCUIT_LABELS[p.circuit_state] ?? CIRCUIT_LABELS.closed

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
      ${!p.is_enabled
        ? 'border-stone-800/50 bg-stone-900/20 opacity-50'
        : p.is_healthy
          ? 'border-stone-800 bg-stone-900/40'
          : 'border-red-500/20 bg-red-500/5'
      }`}
    >
      {/* Dot statut */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        !p.is_enabled ? 'bg-stone-700' :
        p.is_healthy  ? 'bg-emerald-500' : 'bg-red-500'
      }`} />

      {/* Nom + priorité */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-stone-200">
            {PROVIDER_ICONS[p.name]} {p.display_name}
          </span>
          <span className="text-[9px] text-stone-600 uppercase tracking-wider">
            P{p.priority}
          </span>
          {!p.is_enabled && (
            <span className="text-[9px] bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Clé manquante
            </span>
          )}
        </div>
        {p.last_error && (
          <p className="text-[10px] text-red-400 truncate mt-0.5">{p.last_error}</p>
        )}
      </div>

      {/* Métriques */}
      <div className="flex items-center gap-4 text-right flex-shrink-0">
        <div>
          <p className="text-[10px] text-stone-600 uppercase tracking-wider">Circuit</p>
          <p className={`text-xs font-bold ${circuit.color}`}>{circuit.text}</p>
        </div>
        <div>
          <p className="text-[10px] text-stone-600 uppercase tracking-wider">Req/min</p>
          <p className="text-xs font-bold text-stone-300">
            {p.requests_this_minute}
            {p.limit_per_minute && (
              <span className="text-stone-600">/{p.limit_per_minute}</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-stone-600 uppercase tracking-wider">Req/jour</p>
          <p className="text-xs font-bold text-stone-300">
            {p.requests_today}
            {p.limit_per_day && (
              <span className="text-stone-600">/{p.limit_per_day}</span>
            )}
          </p>
        </div>
        {p.avg_response_ms > 0 && (
          <div>
            <p className="text-[10px] text-stone-600 uppercase tracking-wider">Latence</p>
            <p className="text-xs font-bold text-stone-300">{Math.round(p.avg_response_ms)}ms</p>
          </div>
        )}
      </div>
    </div>
  )
}
