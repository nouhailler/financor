import { useState } from 'react'
import ProviderSelector from '../components/ProviderSelector.jsx'
import { useProviderStatus } from '../hooks/useProviderStatus.js'

// ─────────────────────────────────────────────────────────────────────────────
//  pages/Settings.jsx — Paramètres complets + panneau configuration providers
// ─────────────────────────────────────────────────────────────────────────────

const API_LINKS = {
  finnhub:       'https://finnhub.io/register',
  twelve_data:   'https://twelvedata.com/register',
  fmp:           'https://site.financialmodelingprep.com/register',
  alpha_vantage: 'https://www.alphavantage.co/support/#api-key',
}

const PROVIDER_INFO = [
  { name: 'finnhub',       label: 'Finnhub',                   priority: 1, delay: 'Temps réel', limit: '60 req/min',  free: true },
  { name: 'twelve_data',   label: 'Twelve Data',               priority: 2, delay: '15 min',     limit: '8 req/min',   free: true },
  { name: 'fmp',           label: 'Financial Modeling Prep',   priority: 3, delay: '15 min',     limit: '250 req/jour', free: true },
  { name: 'alpha_vantage', label: 'Alpha Vantage',             priority: 4, delay: '20 min',     limit: '25 req/jour', free: true },
]

function Section({ title, children }) {
  return (
    <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-800">
        <h3 className="serif text-xl text-stone-100">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Toggle({ label, desc, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm text-stone-300 font-medium">{label}</p>
        {desc && <p className="text-xs text-stone-600 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-primary' : 'bg-stone-700'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[26px]' : 'left-1'}`} />
      </button>
    </div>
  )
}

export default function Settings() {
  const [provider, setProvider] = useState(
    () => localStorage.getItem('financor_provider') ?? 'auto'
  )
  const { backendOnline } = useProviderStatus()

  const handleProviderChange = (p) => {
    setProvider(p)
    localStorage.setItem('financor_provider', p)
  }

  return (
    <div className="p-8 max-w-[860px]">
      <h1 className="serif text-4xl text-stone-100 mb-8">Paramètres</h1>

      <div className="space-y-6">

        {/* ── SOURCES DE DONNÉES ─────────────────────────────────────────── */}
        <Section title="Sources de données">
          <ProviderSelector value={provider} onChange={handleProviderChange} compact={false} />
        </Section>

        {/* ── TABLEAU COMPARATIF DES PROVIDERS ─────────────────────────── */}
        <Section title="Fournisseurs disponibles">
          <p className="text-sm text-stone-400 mb-5">
            Toutes les clés sont gratuites. Le système utilise les providers selon leur priorité
            et bascule automatiquement en cas d'erreur ou de limite atteinte.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-stone-500 uppercase tracking-wider border-b border-stone-800">
                  {['Priorité','Fournisseur','Délai données','Limite gratuite','Obtenir une clé'].map(h => (
                    <th key={h} className="pb-3 pr-4 text-left font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {PROVIDER_INFO.map(p => (
                  <tr key={p.name} className="hover:bg-stone-800/20 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20
                                       text-primary text-[10px] font-bold flex items-center justify-center">
                        {p.priority}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-stone-200">{p.label}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-bold ${
                        p.delay === 'Temps réel' ? 'text-emerald-500' : 'text-amber-400'
                      }`}>
                        {p.delay}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-stone-400 text-xs">{p.limit}</td>
                    <td className="py-3.5">
                      <a
                        href={API_LINKS[p.name]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Inscription gratuite
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instructions de configuration */}
          <div className="mt-6 p-4 bg-stone-950/60 border border-stone-800 rounded-xl">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              Comment configurer les clés API
            </p>
            <ol className="text-sm text-stone-400 space-y-2 list-decimal list-inside">
              <li>Inscris-toi sur un ou plusieurs des fournisseurs ci-dessus (gratuit)</li>
              <li>
                Copie le fichier <code className="text-primary bg-stone-900 px-1.5 py-0.5 rounded text-xs">.env.example</code> en{' '}
                <code className="text-primary bg-stone-900 px-1.5 py-0.5 rounded text-xs">.env</code>{' '}
                dans le dossier <code className="text-stone-300 text-xs">backend/</code>
              </li>
              <li>Colle tes clés dans le fichier <code className="text-primary bg-stone-900 px-1.5 py-0.5 rounded text-xs">.env</code></li>
              <li>
                Démarre le backend :{' '}
                <code className="text-primary bg-stone-900 px-1.5 py-0.5 rounded text-xs">
                  cd backend && uvicorn main:app --reload --port 8000
                </code>
              </li>
            </ol>
          </div>

          {/* Statut backend */}
          <div className={`mt-4 flex items-center gap-3 p-3 rounded-lg border ${
            backendOnline
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${backendOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${backendOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {backendOnline
                ? 'Backend Python connecté — données réelles disponibles'
                : 'Backend non détecté sur localhost:8000 — mode simulation actif'}
            </span>
          </div>
        </Section>

        {/* ── GÉNÉRAL ────────────────────────────────────────────────────── */}
        <Section title="Général">
          <div className="space-y-4">
            {[
              { label: "Devise d'affichage", options: ['USD ($)', 'EUR (€)', 'CHF (Fr)'] },
              { label: 'Fuseau horaire',     options: ['Europe/Paris (CET)', 'America/New_York (EST)', 'UTC'] },
              { label: 'Langue',             options: ['Français', 'English', 'Deutsch'] },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between gap-4">
                <label className="text-sm text-stone-300 font-medium">{f.label}</label>
                <select className="bg-stone-950 border border-stone-800 text-stone-300 text-sm rounded-lg
                                   px-3 py-2 outline-none focus:border-primary/50 min-w-[200px]">
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Section>

        {/* ── AFFICHAGE ──────────────────────────────────────────────────── */}
        <Section title="Affichage">
          <div className="space-y-3">
            <Toggle label="Thème sombre" desc="Actif par défaut, recommandé pour la lisibilité" defaultOn />
            <Toggle label="Afficher la source des données" desc="Badge fournisseur visible sur le dashboard" defaultOn />
            <Toggle label="Indicateur de fraîcheur" desc="Couleur selon l'âge des données (vert/jaune/rouge)" defaultOn />
          </div>
        </Section>

        {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
        <Section title="Notifications">
          <div className="space-y-3">
            <Toggle label="Alertes de prix"       desc="Notifier quand un seuil est atteint"            defaultOn />
            <Toggle label="Newsletter hebdomadaire" desc="Résumé des marchés chaque lundi"               />
            <Toggle label="Résumé quotidien"       desc="Récapitulatif à la clôture des marchés"        defaultOn />
            <Toggle label="Alerte backend hors ligne" desc="Avertir si le serveur de données est inaccessible" defaultOn />
          </div>
        </Section>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button className="btn-primary">Enregistrer les modifications</button>
          <button className="btn-secondary">Annuler</button>
        </div>

      </div>
    </div>
  )
}
