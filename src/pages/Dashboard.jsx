// ─────────────────────────────────────────────────────────────────────────────
//  pages/Dashboard.jsx  v2
//  - Utilise idx.apiSymbol (ETF proxy) pour les appels backend indices
//  - Affiche idx.symbol (^GSPC etc.) dans l'UI
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { INDICES as MOCK_INDICES, CHART_DATA, WATCHLIST as MOCK_WATCHLIST, NEWS } from '../data/mockData.js'
import { useBackend } from '../hooks/useBackend.js'
import ProviderSelector from '../components/ProviderSelector.jsx'
import DataSourceBar    from '../components/DataSourceBar.jsx'

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmt(v, dec = 2) {
  if (v == null || isNaN(v)) return '—'
  return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function sign(v) { return v >= 0 ? '+' : '' }

// ─────────────────────────────────────────────────────────────────────────────
//  Sparkline
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, up }) {
  const max = Math.max(...data)
  const color = up ? '#10b981' : '#ef4444'
  return (
    <div className="flex items-end gap-[2px] h-12 w-full mt-3">
      {data.map((v, i) => {
        const h = Math.max(8, Math.round((v / max) * 100))
        return (
          <div key={i} className="flex-1 rounded-t-sm"
            style={{ height: `${h}%`, background: color, opacity: i === data.length - 1 ? 1 : 0.15 + i * 0.10 }}
          />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Carte indice
// ─────────────────────────────────────────────────────────────────────────────
function IndexCard({ index, isActive, onClick, isLive }) {
  const up = index.changePct >= 0
  return (
    <div onClick={onClick}
      className={`relative bg-stone-900 border rounded-xl p-5 cursor-pointer transition-all duration-200
        hover:border-stone-700 ${isActive ? 'border-primary shadow-[0_0_0_1px_#c2652a30]' : 'border-stone-800'}`}
    >
      {isActive && <div className="absolute inset-x-0 top-0 h-[2px] bg-primary rounded-t-xl" />}

      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">{index.name}</h3>
          {/* Affiche le symbole Yahoo officiel (^GSPC etc.) */}
          <p className="text-[10px] text-stone-600 font-mono">{index.symbol}</p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold flex items-center justify-end gap-0.5 ${up ? 'text-emerald-500' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-sm">{up ? 'arrow_upward' : 'arrow_downward'}</span>
            {sign(index.changePct)}{fmt(index.changePct)}%
          </div>
          <p className={`text-xs ${up ? 'text-emerald-600' : 'text-red-600'}`}>
            {sign(index.change)}{fmt(index.change)}
          </p>
        </div>
      </div>

      <p className="text-2xl font-semibold text-stone-100 mt-3 tabular-nums">{fmt(index.price)}</p>

      {isLive && (
        <div className="absolute top-3 right-3">
          <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
            live
          </span>
        </div>
      )}

      <Sparkline data={index.sparkline} up={up} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tooltip chart
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-stone-500 mb-0.5 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-stone-100 tabular-nums">{fmt(payload[0]?.value)}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Graphique principal
//  Utilise index.apiSymbol pour l'appel backend (ETF proxy)
// ─────────────────────────────────────────────────────────────────────────────
const PERIODS = ['1D', '1W', '1M', '1Y', 'ALL']
const PERIOD_LABELS = { '1D': '1J', '1W': '1S', '1M': '1M', '1Y': '1A', 'ALL': 'ALL' }

function MainChart({ activeIndex, indices, provider }) {
  const [period,      setPeriod]      = useState('1M')
  const [chartData,   setChartData]   = useState(null)
  const [chartSource, setChartSource] = useState('mock')

  const index = indices[activeIndex]
  const up    = index.changePct >= 0
  const color = activeIndex === 3 ? '#f59e0b' : (up ? '#10b981' : '#ef4444')
  const gradId = `grad-${index.id}`

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // ← Utilise apiSymbol (SPY, QQQ, USO, GLD) — supporté par toutes les APIs
        const apiSym = index.apiSymbol || index.symbol
        const params = new URLSearchParams({ period })
        if (provider && provider !== 'auto') params.set('provider', provider)
        const res = await fetch(`/api/history/${apiSym}?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const hist = await res.json()
        if (!cancelled && hist.closes?.length) {
          setChartData(hist.labels.map((label, i) => ({ label, value: hist.closes[i] })))
          setChartSource(hist.provider)
        }
      } catch {
        if (!cancelled) {
          const d = CHART_DATA[period]
          setChartData(d.labels.map((label, i) => ({ label, value: d.series[index.id]?.[i] ?? 0 })))
          setChartSource('mock')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [period, index.id, index.apiSymbol, index.symbol, provider])

  const displayData = useMemo(() => {
    if (chartData) return chartData
    const d = CHART_DATA[period]
    return d.labels.map((label, i) => ({ label, value: d.series[index.id]?.[i] ?? 0 }))
  }, [chartData, period, index.id])

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden mb-8 shadow-xl">
      <div className="border-b border-stone-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="serif text-xl text-stone-100">{index.name}</span>
          <span className={`text-sm font-bold tabular-nums ${up ? 'text-emerald-500' : 'text-red-500'}`}>
            {sign(index.changePct)}{fmt(index.changePct)}%
          </span>
          {chartSource !== 'mock' && (
            <span className="text-[9px] text-stone-600 uppercase tracking-wider font-mono">
              via {chartSource}
              {index.apiSymbol && index.apiSymbol !== index.symbol &&
                ` (${index.apiSymbol} proxy)`}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                period === p
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-3 bg-stone-950/40 border-b border-stone-800/50 flex items-center gap-4">
        <span className="text-3xl font-semibold text-stone-100 tabular-nums serif">{fmt(index.price)}</span>
        <span className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded ${
          up ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
        }`}>
          <span className="material-symbols-outlined text-sm">{up ? 'arrow_upward' : 'arrow_downward'}</span>
          {sign(index.change)}{fmt(index.change)} ({sign(index.changePct)}{fmt(index.changePct)}%)
        </span>
        <span className="text-[10px] text-stone-600 uppercase tracking-wider">
          {period}{chartSource === 'mock' ? ' · Simulé' : ''}
        </span>
      </div>

      <div className="h-[340px] px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e1c1a" strokeDasharray="0" vertical={false} />
            <XAxis dataKey="label"
              tick={{ fill: '#57534e', fontSize: 10, fontFamily: 'Manrope' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis orientation="right"
              tick={{ fill: '#57534e', fontSize: 10, fontFamily: 'Manrope' }}
              axisLine={false} tickLine={false} width={70} domain={['auto', 'auto']}
              tickFormatter={v =>
                v >= 10000 ? `${(v/1000).toFixed(0)}K`
                : v >= 1000 ? v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                : v.toFixed(2)
              }
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#44403c', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="value"
              stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: '#0c0a09', strokeWidth: 2 }}
              style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  News card
// ─────────────────────────────────────────────────────────────────────────────
const TAG_STYLES = {
  primary: 'bg-primary/10 text-primary',
  gold:    'bg-amber-500/10 text-amber-500',
  muted:   'bg-stone-800 text-stone-400',
}

function NewsCard({ article }) {
  const navigate = useNavigate()
  return (
    <article onClick={() => navigate('/news')}
      className="bg-stone-900 border border-stone-800 p-6 rounded-xl group cursor-pointer hover:border-primary/40 transition-all duration-200"
    >
      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${TAG_STYLES[article.tagColor]}`}>
              {article.tag}
            </span>
            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">
              {article.time} · {article.source}
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-200 group-hover:text-primary transition-colors leading-snug mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-stone-400 line-clamp-2 font-light leading-relaxed">{article.summary}</p>
        </div>
        <div className="w-24 h-20 rounded-lg bg-stone-800 shrink-0 hidden sm:flex items-center justify-center text-3xl">
          {article.icon}
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Watchlist mini
//  Utilise le symbole direct (AAPL etc.) — pas de proxy nécessaire pour les actions
// ─────────────────────────────────────────────────────────────────────────────
function WatchlistMini({ provider, backendOnline }) {
  const navigate = useNavigate()
  const [liveData, setLiveData] = useState({})

  useEffect(() => {
    if (!backendOnline) return
    let cancelled = false
    const symbols = MOCK_WATCHLIST.slice(0, 5).map(w => w.symbol)

    const fetchAll = async () => {
      const results = {}
      await Promise.allSettled(symbols.map(async sym => {
        try {
          const params = new URLSearchParams()
          if (provider && provider !== 'auto') params.set('provider', provider)
          const res = await fetch(`/api/quote/${sym}?${params}`)
          if (res.ok) results[sym] = await res.json()
        } catch { /* silencieux */ }
      }))
      if (!cancelled) setLiveData(results)
    }

    fetchAll()
    const id = setInterval(fetchAll, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [backendOnline, provider])

  const items = MOCK_WATCHLIST.slice(0, 5).map(w => {
    const live = liveData[w.symbol]
    return live
      ? { ...w, price: live.price, change: live.change, changePct: live.change_percent, isLive: true }
      : { ...w, isLive: false }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif text-2xl text-stone-100">Watchlist</h2>
        <button onClick={() => navigate('/watchlist')}
          className="material-symbols-outlined text-stone-500 hover:text-primary transition-colors">
          add_circle
        </button>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-950/50 border-b border-stone-800">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Ticker</th>
              <th className="px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-right">Prix</th>
              <th className="px-4 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-right">Chg %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {items.map(w => {
              const up = w.changePct >= 0
              return (
                <tr key={w.symbol} onClick={() => navigate('/watchlist')}
                  className="hover:bg-stone-800/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-stone-200 text-sm">{w.symbol}</div>
                      {w.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                    </div>
                    <div className="text-[10px] text-stone-500">{w.name}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-stone-200 tabular-nums">
                    {fmt(w.price)}
                  </td>
                  <td className={`px-4 py-3.5 text-right font-bold tabular-nums ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                    {sign(w.changePct)}{fmt(w.changePct)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="p-3 bg-stone-950/30 border-t border-stone-800">
          <button onClick={() => navigate('/watchlist')}
            className="w-full py-2 text-xs font-bold text-stone-400 hover:text-stone-200 border border-stone-700 rounded-lg transition-all hover:border-stone-500">
            Voir les 12 actifs →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Dashboard principal
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { online: backendOnline } = useBackend()

  const [provider, setProvider] = useState(
    () => localStorage.getItem('financor_provider') ?? 'auto'
  )
  const handleProviderChange = (p) => {
    setProvider(p)
    localStorage.setItem('financor_provider', p)
  }

  const [indices,       setIndices]       = useState(MOCK_INDICES)
  const [indicesQuotes, setIndicesQuotes] = useState({})
  const [lastQuote,     setLastQuote]     = useState(null)
  const [activeIdx,     setActiveIdx]     = useState(0)

  const fetchIndices = useCallback(async () => {
    if (!backendOnline) return
    const results = {}
    await Promise.allSettled(MOCK_INDICES.map(async (idx) => {
      try {
        // ← Clé : utilise idx.apiSymbol (SPY/QQQ/USO/GLD), pas idx.symbol
        const apiSym = idx.apiSymbol || idx.symbol
        const params = new URLSearchParams()
        if (provider && provider !== 'auto') params.set('provider', provider)
        const res = await fetch(`/api/quote/${apiSym}?${params}`)
        if (res.ok) {
          const q = await res.json()
          // Stocke avec la clé apiSymbol pour retrouver facilement
          results[idx.id] = q
        }
      } catch { /* silencieux */ }
    }))

    if (Object.keys(results).length) {
      setIndicesQuotes(results)
      setIndices(prev => prev.map(idx => {
        const q = results[idx.id]
        if (!q) return idx
        return {
          ...idx,
          price:     q.price,
          change:    q.change,
          changePct: q.change_percent,
        }
      }))
      const first = Object.values(results)[0]
      if (first) setLastQuote(first)
    }
  }, [backendOnline, provider])

  useEffect(() => {
    fetchIndices()
    const id = setInterval(fetchIndices, 60_000)
    return () => clearInterval(id)
  }, [fetchIndices])

  return (
    <div className="p-8 max-w-[1600px]">

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="serif text-4xl text-stone-100 leading-tight">Tableau de bord</h1>
          <p className="text-stone-500 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProviderSelector value={provider} onChange={handleProviderChange} compact />
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500
                          bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-dot" style={{ color: '#10b981' }} />
            {backendOnline ? 'LIVE' : 'SIMULÉ'}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <DataSourceBar quote={lastQuote} backendOnline={backendOnline} provider={provider} onRefresh={fetchIndices} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {indices.map((idx, i) => (
          <IndexCard
            key={idx.id}
            index={idx}
            isActive={activeIdx === i}
            onClick={() => setActiveIdx(i)}
            isLive={backendOnline && !!indicesQuotes[idx.id]}
          />
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-stone-950 rounded-lg inline-flex border border-stone-800/50 mb-[-1px] relative z-10">
        {indices.map((idx, i) => (
          <button key={idx.id} onClick={() => setActiveIdx(i)}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
              activeIdx === i ? 'bg-primary text-white' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {idx.name}
          </button>
        ))}
      </div>

      <MainChart activeIndex={activeIdx} indices={indices} provider={provider} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="serif text-2xl text-stone-100">Market Intelligence</h2>
            <button onClick={() => navigate('/news')}
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
              Fil complet →
            </button>
          </div>
          {NEWS.map(a => <NewsCard key={a.id} article={a} />)}
        </div>
        <WatchlistMini provider={provider} backendOnline={backendOnline} />
      </div>
    </div>
  )
}
