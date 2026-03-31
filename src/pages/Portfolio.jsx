import { PORTFOLIO } from '../data/mockData.js'

function fmt(v, dec = 2) {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function sign(v) { return v >= 0 ? '+' : '' }

export default function Portfolio() {
  const rows = PORTFOLIO.map(h => {
    const totalValue = h.price * h.qty
    const costBasis = h.avgCost * h.qty
    const gain = totalValue - costBasis
    const gainPct = (gain / costBasis) * 100
    return { ...h, totalValue, costBasis, gain, gainPct }
  })

  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0)
  const totalGain = rows.reduce((s, r) => s + r.gain, 0)
  const totalGainPct = (totalGain / (totalValue - totalGain)) * 100

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="serif text-5xl text-stone-100 tracking-tight">Portefeuille</h1>
          <p className="text-stone-400 mt-2 font-light text-sm">Mis à jour il y a 2 minutes</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Ajouter une position
        </button>
      </div>

      {/* Summary bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="md:col-span-2 bg-stone-900/40 border border-stone-800 p-8 rounded-2xl">
          <p className="text-stone-500 text-sm font-medium mb-1">Valeur totale du portefeuille</p>
          <div className="flex items-baseline gap-4">
            <h3 className="serif text-5xl text-stone-100 tracking-tighter">{fmt(totalValue)} $</h3>
            <span className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
              totalGainPct >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
            }`}>
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {sign(totalGainPct)}{fmt(totalGainPct)}%
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-stone-900/40 border border-stone-800 p-6 rounded-2xl">
            <p className="text-stone-500 text-sm mb-1">Gain/Perte total</p>
            <div className={`serif text-3xl ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {sign(totalGain)}{fmt(totalGain)} $
            </div>
          </div>
          <div className="bg-stone-900/40 border border-stone-800 p-6 rounded-2xl">
            <p className="text-stone-500 text-sm mb-1">Positions</p>
            <div className="serif text-3xl text-stone-100">{rows.length}</div>
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-stone-800">
          <h4 className="serif text-xl text-stone-100">Positions</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-stone-500 uppercase tracking-widest border-b border-stone-800/50">
                {['Ticker','Société','Qté','Coût moy.','Prix actuel','Valeur totale','Gain/Perte'].map(h => (
                  <th key={h} className={`py-5 px-6 font-bold ${h !== 'Ticker' && h !== 'Société' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-stone-300 divide-y divide-stone-800/30">
              {rows.map(r => (
                <tr key={r.symbol} className="hover:bg-stone-900/30 transition-colors">
                  <td className="py-4 px-6 font-bold text-stone-100">{r.symbol}</td>
                  <td className="py-4 px-6 text-stone-400">{r.name}</td>
                  <td className="py-4 px-6 text-right tabular-nums">{fmt(r.qty, 0)}</td>
                  <td className="py-4 px-6 text-right text-stone-500 tabular-nums">{fmt(r.avgCost)} $</td>
                  <td className="py-4 px-6 text-right font-bold tabular-nums">{fmt(r.price)} $</td>
                  <td className="py-4 px-6 text-right font-bold text-stone-100 tabular-nums">{fmt(r.totalValue)} $</td>
                  <td className={`py-4 px-6 text-right font-bold tabular-nums ${r.gainPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {sign(r.gainPct)}{fmt(r.gainPct)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sector allocation */}
        <div className="p-6 border-t border-stone-800">
          <h5 className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-4">Allocation sectorielle</h5>
          <div className="space-y-3">
            {[
              { label: 'Technologie', pct: 64 },
              { label: 'Services Financiers', pct: 18 },
              { label: 'Consommation', pct: 12 },
              { label: 'Automotive', pct: 6 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300">{s.label}</span>
                  <span className="text-stone-500">{s.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
