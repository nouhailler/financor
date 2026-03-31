import { useState } from 'react'
import { WATCHLIST } from '../data/mockData.js'

function fmt(v, dec = 2) {
  if (v == null) return '—'
  return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function sign(v) { return v >= 0 ? '+' : '' }

function SparkSVG({ data, up }) {
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const w = 100, h = 40
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-8" fill="none" stroke={up ? '#10b981' : '#ef4444'} strokeWidth="2" strokeLinecap="round">
      <polyline points={pts} />
    </svg>
  )
}

export default function Watchlist() {
  const [filter, setFilter] = useState('')
  const [sector, setSector] = useState('Tous')

  const sectors = ['Tous', ...new Set(WATCHLIST.map(w => w.sector))]
  const filtered = WATCHLIST.filter(w => {
    const q = filter.toLowerCase()
    const matchQ = !q || w.symbol.toLowerCase().includes(q) || w.name.toLowerCase().includes(q)
    const matchS = sector === 'Tous' || w.sector === sector
    return matchQ && matchS
  })

  const best = [...WATCHLIST].sort((a, b) => b.changePct - a.changePct)[0]
  const worst = [...WATCHLIST].sort((a, b) => a.changePct - b.changePct)[0]
  const totalVal = WATCHLIST.reduce((s, w) => s + w.price, 0)

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <nav className="text-[10px] text-primary uppercase tracking-widest font-bold mb-2 flex gap-2">
            <span>Marchés</span><span className="text-stone-600">/</span>
            <span className="text-stone-500">Watchlist</span>
          </nav>
          <h1 className="serif text-5xl text-stone-100">Investment Watchlist</h1>
          <p className="text-stone-500 mt-2 text-sm">Performance en temps réel de vos sélections.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 self-start">
          <span className="material-symbols-outlined text-lg">add</span>
          Ajouter un actif
        </button>
      </div>

      {/* Bento stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Meilleure perf. aujourd\'hui', badge: `+${fmt(best.changePct)}%`, badgeColor: 'emerald', name: best.name, symbol: best.symbol, price: best.price },
          { label: 'Valeur totale watchlist', value: `${fmt(totalVal)} $`, sub: `${WATCHLIST.length} actifs suivis` },
          { label: 'Moins bonne perf. aujourd\'hui', badge: `${sign(worst.changePct)}${fmt(worst.changePct)}%`, badgeColor: 'rose', name: worst.name, symbol: worst.symbol, price: worst.price },
        ].map((s, i) => (
          <div key={i} className="bg-stone-900/40 border border-stone-800 p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{s.label}</span>
              {s.badge && (
                <span className={`bg-${s.badgeColor}-500/10 text-${s.badgeColor}-500 px-2 py-0.5 rounded text-[10px] font-bold`}>
                  {s.badge}
                </span>
              )}
            </div>
            {s.value
              ? <div className="serif text-3xl text-stone-100">{s.value}</div>
              : <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-300">{s.symbol}</div>
                  <div>
                    <div className="serif text-lg text-stone-100">{s.name}</div>
                    <div className="text-2xl font-bold text-stone-100">${fmt(s.price)}</div>
                  </div>
                </div>
            }
            {s.sub && <p className="text-stone-600 text-xs mt-2">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-[18px]">search</span>
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filtrer la liste..."
                className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm
                           text-stone-200 placeholder:text-stone-600 outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="bg-stone-950 border border-stone-800 text-stone-400 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary/50"
            >
              {sectors.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-1">
            <button className="p-2 text-stone-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button className="p-2 text-stone-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-widest text-stone-500 font-bold border-b border-stone-800">
                {['Ticker','Société','Prix','Chg ($)','Chg (%)','Volume','Tendance 7j','Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 font-bold ${h === 'Prix' || h.startsWith('Chg') || h === 'Volume' ? 'text-right' : ''} ${h === 'Tendance 7j' || h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-stone-800/40">
              {filtered.map(w => {
                const up = w.changePct >= 0
                return (
                  <tr key={w.symbol} className="hover:bg-stone-800/20 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-[9px] font-bold text-stone-300">
                          {w.symbol.slice(0, 2)}
                        </div>
                        <span className="font-bold text-stone-100">{w.symbol}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-400 serif text-base">{w.name}</td>
                    <td className="px-5 py-4 text-right font-bold text-stone-100 tabular-nums">${fmt(w.price)}</td>
                    <td className={`px-5 py-4 text-right font-bold tabular-nums ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                      {sign(w.change)}${fmt(Math.abs(w.change))}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {sign(w.changePct)}{fmt(w.changePct)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-stone-500 font-mono text-xs">{w.volume}</td>
                    <td className="px-5 py-4 flex justify-center">
                      <SparkSVG data={w.sparkline} up={up} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button className="material-symbols-outlined text-stone-600 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 text-[20px]">
                        more_vert
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-800 flex items-center justify-between">
          <span className="text-sm text-stone-500">
            Affichage de <span className="font-bold text-stone-300">{filtered.length}</span> sur <span className="font-bold text-stone-300">{WATCHLIST.length}</span> actifs
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-8 h-8 rounded text-xs font-bold ${p === 1 ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
