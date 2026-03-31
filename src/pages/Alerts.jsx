import { useState } from 'react'
import { ALERTS } from '../data/mockData.js'

export default function Alerts() {
  const [alerts, setAlerts] = useState(ALERTS)

  const toggle = (id) => setAlerts(prev =>
    prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a)
  )

  const stats = [
    { label: 'Alertes actives', value: alerts.filter(a => a.status === 'active').length, icon: 'campaign', sub: `+3 cette semaine` },
    { label: 'Déclenchées aujourd\'hui', value: 12, icon: 'bolt', sub: 'Dernière : il y a 14m' },
    { label: 'En attente', value: 8, icon: 'hourglass_empty', sub: 'Tous systèmes OK' },
  ]

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="serif text-4xl text-stone-100 mb-2">Gestion des Alertes</h1>
          <p className="text-stone-500">Surveillez et affinez vos déclencheurs de marché en temps réel.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>
          Créer une alerte
        </button>
      </div>

      {/* Bento stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-stone-900/40 border border-stone-800 p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">{s.icon}</span>
            </div>
            <p className="text-sm text-stone-500 mb-1">{s.label}</p>
            <h3 className="serif text-4xl text-stone-100">{s.value}</h3>
            <p className="mt-3 text-xs text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Alert table */}
      <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
          <h4 className="serif text-xl text-stone-100">Alertes récentes</h4>
          <div className="flex gap-1">
            <button className="p-2 text-stone-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 text-stone-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-stone-500 uppercase tracking-widest border-b border-stone-800">
                {['Actif','Condition','Statut','Notifications','Actions'].map(h => (
                  <th key={h} className={`px-6 py-4 font-bold ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/30">
              {alerts.map(a => (
                <tr key={a.id} className="hover:bg-stone-800/20 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center font-bold text-primary text-xs">
                        {a.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-stone-100">{a.symbol}</p>
                        <p className="text-xs text-stone-500">{a.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-stone-800 rounded-full text-sm text-stone-300">
                      {a.condition} <span className="text-stone-100 font-bold">{a.value}</span>
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${a.status === 'active' ? 'bg-primary glow-dot' : 'bg-stone-600'}`}
                        style={a.status === 'active' ? { color: '#c2652a' } : {}}
                      />
                      <span className={`text-sm font-medium ${a.status === 'active' ? 'text-stone-200' : 'text-stone-500'}`}>
                        {a.status === 'active' ? 'Active' : 'En pause'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2 text-stone-500">
                      {a.channels.map(c => (
                        <span key={c} className="material-symbols-outlined text-sm" title={c}>{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end items-center gap-3">
                      {/* Toggle */}
                      <button
                        onClick={() => toggle(a.id)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${a.status === 'active' ? 'bg-primary' : 'bg-stone-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${a.status === 'active' ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      <button className="text-stone-500 hover:text-stone-300 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}
                        className="text-stone-600 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Create */}
      <div className="max-w-sm">
        <h4 className="serif text-2xl text-stone-100 mb-5">Création rapide</h4>
        <div className="bg-stone-900/40 border border-stone-800 p-6 rounded-xl space-y-4">
          {[
            { label: 'Symbole', type: 'text', placeholder: 'ex: BTCUSDT' },
            { label: 'Valeur seuil', type: 'number', placeholder: '0.00' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-sm text-stone-200
                           placeholder:text-stone-600 outline-none focus:border-primary/50 transition-all" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Type de déclencheur</label>
            <select className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-sm text-stone-300 outline-none focus:border-primary/50">
              {['Prix supérieur','Prix inférieur','Volume élevé','Variation % (24h)'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all mt-2">
            Activer l'alerte
          </button>
        </div>
      </div>
    </div>
  )
}
