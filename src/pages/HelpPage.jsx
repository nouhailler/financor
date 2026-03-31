// ─────────────────────────────────────────────────────────────────────────────
//  pages/HelpPage.jsx — Documentation contextuelle in-app
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'overview',
    icon: 'home',
    title: 'Vue d\'ensemble',
    content: [
      {
        type: 'intro',
        text: 'Financor est un terminal boursier open source conçu pour le grand public. Il affiche des données financières réelles provenant de plusieurs sources gratuites, avec une bascule automatique entre fournisseurs en cas de panne ou de limite atteinte.',
      },
      {
        type: 'cards',
        items: [
          { icon: '📊', title: 'Tableau de bord', desc: 'Indices mondiaux, graphique interactif, actualités et watchlist en un coup d\'œil.' },
          { icon: '⭐', title: 'Watchlist', desc: '12 titres à suivre avec prix en temps réel, variation et tendance sur 7 jours.' },
          { icon: '🔔', title: 'Alertes', desc: 'Notifications quand un titre dépasse ou passe sous un seuil de prix.' },
          { icon: '💼', title: 'Portefeuille', desc: 'Suivi de tes positions, valeur totale et allocation sectorielle.' },
          { icon: '📰', title: 'Actualités', desc: 'Fil d\'actualités financières par actif ou catégorie.' },
          { icon: '⚙️', title: 'Paramètres', desc: 'Configuration des sources de données, notifications et préférences d\'affichage.' },
        ],
      },
    ],
  },
  {
    id: 'data',
    icon: 'database',
    title: 'Sources de données',
    content: [
      {
        type: 'text',
        text: 'Les données proviennent de plusieurs APIs publiques gratuites. Financor les interroge dans un ordre de priorité et bascule automatiquement vers la suivante en cas de problème.',
      },
      {
        type: 'table',
        headers: ['Fournisseur', 'Délai', 'Limite', 'Priorité'],
        rows: [
          ['Finnhub', 'Temps réel', '60 req/min', '⚡ 1er'],
          ['Twelve Data', '~15 min', '8 req/min', '📊 2e'],
          ['Financial Modeling Prep', '~15 min', '250/jour', '📈 3e'],
          ['Alpha Vantage', '~20 min', '25/jour', '🔬 4e (secours)'],
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Comment obtenir une clé API gratuite',
        text: 'Rends-toi dans Paramètres → Sources de données. Les liens d\'inscription sont listés là-bas. Finnhub seul suffit pour démarrer — c\'est le plus généreux et le seul à offrir des données temps réel.',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Sans clé API',
        text: 'L\'application fonctionne sans configuration avec des données simulées réalistes. Les prix et variations sont cohérents mais fictifs. Un badge "Simulé" l\'indique clairement.',
      },
    ],
  },
  {
    id: 'freshness',
    icon: 'schedule',
    title: 'Fraîcheur des données',
    content: [
      {
        type: 'text',
        text: 'Financor n\'est pas conçu pour le trading haute fréquence. Les données peuvent avoir un délai de 0 à 20 minutes selon le fournisseur actif. L\'interface t\'informe toujours de la fraîcheur et de la source.',
      },
      {
        type: 'badges',
        items: [
          { color: 'emerald', label: 'À jour', desc: 'Données de moins de 5 minutes.' },
          { color: 'amber',   label: 'X min',  desc: 'Données différées. Indique le nombre de minutes depuis la dernière mise à jour.' },
          { color: 'red',     label: 'X min',  desc: 'Données trop anciennes (> 20 min). Le système essaie de rafraîchir.' },
          { color: 'stone',   label: 'Simulé', desc: 'Backend non connecté. Données de démonstration affichées.' },
        ],
      },
      {
        type: 'text',
        text: 'Les données se rafraîchissent automatiquement toutes les 60 secondes quand le backend est connecté. Tu peux aussi forcer un rafraîchissement avec le bouton ↻ dans la barre de données.',
      },
    ],
  },
  {
    id: 'indices',
    icon: 'show_chart',
    title: 'Indices et ETF proxy',
    content: [
      {
        type: 'text',
        text: 'Les APIs gratuites ne permettent pas d\'interroger directement les indices boursiers (^GSPC, ^IXIC) ni les contrats futures (CL=F, GC=F). Financor utilise des ETF très corrélés comme proxy :',
      },
      {
        type: 'table',
        headers: ['Affiché dans l\'UI', 'Symbole réel', 'ETF interrogé', 'Corrélation'],
        rows: [
          ['S&P 500', '^GSPC', 'SPY — SPDR S&P 500', '> 0.999'],
          ['NASDAQ', '^IXIC', 'QQQ — Invesco Nasdaq', '> 0.998'],
          ['WTI Pétrole', 'CL=F', 'USO — US Oil Fund', 'Élevée'],
          ['Or', 'GC=F', 'GLD — SPDR Gold', '> 0.999'],
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Impact sur les valeurs affichées',
        text: 'Les prix affichés sont ceux des ETF, pas les valeurs exactes des indices. Exemple : SPY ≈ S&P 500 ÷ 10. Les variations en pourcentage (+0.8%, -1.2%) restent exactes car les ETF répliquent fidèlement les mouvements des indices.',
      },
    ],
  },
  {
    id: 'router',
    icon: 'alt_route',
    title: 'Smart Router (technique)',
    content: [
      {
        type: 'text',
        text: 'Le backend Python orchestre les appels aux APIs via un système de routage intelligent. Voici comment il décide quelle source utiliser.',
      },
      {
        type: 'steps',
        items: [
          { n: '1', title: 'Sélection automatique', desc: 'Le router trie les fournisseurs par priorité (1→4), en excluant ceux qui ont un circuit ouvert ou qui ont atteint leur limite de requêtes.' },
          { n: '2', title: 'Tentative avec retry', desc: 'Il essaie le premier fournisseur disponible. En cas d\'échec, il attend un court délai (retry exponentiel : 0.4s, 0.8s) avant de réessayer.' },
          { n: '3', title: 'Failover en cascade', desc: 'Si le fournisseur échoue définitivement, le router passe automatiquement au suivant dans la liste.' },
          { n: '4', title: 'Circuit Breaker', desc: 'Après 5 échecs consécutifs, le circuit s\'ouvre pendant 60 secondes. Le fournisseur est ignoré pendant cette période pour ne pas le surcharger.' },
          { n: '5', title: 'Récupération', desc: 'Après 60 secondes, le circuit passe en "half-open" : une requête test est envoyée. Si elle réussit, le circuit se referme et le fournisseur redevient disponible.' },
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Voir l\'état en temps réel',
        text: 'L\'onglet Paramètres → Sources de données affiche l\'état de chaque provider : circuit ouvert/fermé, nombre de requêtes aujourd\'hui, latence moyenne.',
      },
    ],
  },
  {
    id: 'provider-selector',
    icon: 'tune',
    title: 'Changer de fournisseur',
    content: [
      {
        type: 'text',
        text: 'Par défaut, Financor choisit automatiquement le meilleur fournisseur disponible. Tu peux forcer un fournisseur spécifique si tu veux comparer les données ou tester une source particulière.',
      },
      {
        type: 'steps',
        items: [
          { n: '→', title: 'Sélecteur compact (header)', desc: 'Le menu déroulant en haut à droite du dashboard permet de changer de fournisseur à la volée. La préférence est sauvegardée entre les sessions.' },
          { n: '→', title: 'Panneau complet (Paramètres)', desc: 'La page Paramètres affiche le tableau de santé complet : état du circuit, requêtes utilisées, latence de chaque fournisseur.' },
          { n: '→', title: 'Mode Automatique', desc: 'Remet en place la sélection intelligente. Recommandé pour une utilisation normale.' },
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Fournisseur désactivé',
        text: 'Un fournisseur apparaît en grisé s\'il n\'a pas de clé API configurée dans le fichier .env. Il est simplement ignoré par le router.',
      },
    ],
  },
  {
    id: 'backend',
    icon: 'dns',
    title: 'Démarrer le backend',
    content: [
      {
        type: 'text',
        text: 'Le backend Python est nécessaire pour obtenir des données réelles. Sans lui, l\'application affiche des données simulées.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `cd /home/patrick/Documents/Claude/Projects/Financor/app/backend
./start.sh`,
      },
      {
        type: 'text',
        text: 'Le script start.sh gère tout automatiquement : création du venv Python, installation des dépendances, vérification du fichier .env, puis démarrage du serveur sur le port 8000.',
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Vérifier que le backend tourne',
        text: 'Ouvre http://localhost:8000/docs dans ton navigateur. Tu verras la documentation interactive Swagger si le backend est actif. Dans l\'app, le badge en haut à droite du Dashboard indique "LIVE" quand la connexion est établie.',
      },
    ],
  },
  {
    id: 'faq',
    icon: 'help',
    title: 'Questions fréquentes',
    content: [
      {
        type: 'faq',
        items: [
          {
            q: 'Les données sont-elles vraiment gratuites ?',
            a: 'Oui. Tous les fournisseurs utilisés proposent un tier gratuit suffisant pour un usage personnel. Finnhub est le plus généreux avec 60 requêtes par minute sans restriction journalière.',
          },
          {
            q: 'Pourquoi les prix des indices semblent différents d\'autres sites ?',
            a: 'Les indices (S&P 500, NASDAQ) sont affichés via des ETF proxy (SPY, QQQ). Les prix absolus diffèrent des indices réels, mais les variations en % sont identiques. C\'est une limitation des APIs gratuites qui ne donnent pas accès aux indices directement.',
          },
          {
            q: 'L\'application fonctionne-t-elle sans connexion internet ?',
            a: 'Non pour les données réelles. En revanche, l\'interface s\'affiche complètement avec des données simulées si le backend n\'est pas connecté ou si les APIs sont inaccessibles.',
          },
          {
            q: 'Comment ajouter un nouveau titre à la watchlist ?',
            a: 'Pour l\'instant, la watchlist est définie dans le fichier src/data/mockData.js. Une interface d\'ajout dynamique est prévue dans une prochaine version.',
          },
          {
            q: 'Peut-on déployer l\'application sur un serveur ?',
            a: 'Oui. Build le frontend avec npm run build, déploie le dossier dist/ sur n\'importe quel hébergeur statique (Netlify, Vercel, GitHub Pages). Pour le backend, utilise Render, Railway ou un VPS avec Uvicorn derrière Nginx.',
          },
          {
            q: 'Le marché est-il ouvert ?',
            a: 'L\'indicateur "Market Status" dans la barre latérale affiche l\'état du NYSE (New York Stock Exchange) en temps réel, calculé à partir du fuseau horaire EST. Hors des heures d\'ouverture (9h30–16h, lun–ven), les données sont figées à la dernière clôture.',
          },
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  Composants de rendu
// ─────────────────────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info:    { bg: 'bg-primary/5 border-primary/20',   icon: 'info',         text: 'text-primary' },
  tip:     { bg: 'bg-emerald-500/5 border-emerald-500/20', icon: 'lightbulb', text: 'text-emerald-400' },
  warning: { bg: 'bg-amber-500/5 border-amber-500/20', icon: 'warning',    text: 'text-amber-400' },
}

const BADGE_COLORS = {
  emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red:     'bg-red-500/10 text-red-500 border-red-500/20',
  stone:   'bg-stone-800 text-stone-500 border-stone-700',
}

function RenderBlock({ block }) {
  switch (block.type) {

    case 'intro':
      return <p className="text-base text-stone-300 leading-relaxed">{block.text}</p>

    case 'text':
      return <p className="text-sm text-stone-400 leading-relaxed">{block.text}</p>

    case 'cards':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {block.items.map((item, i) => (
            <div key={i} className="bg-stone-900/60 border border-stone-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-bold text-stone-200 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-stone-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      )

    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800">
                {block.headers.map((h, i) => (
                  <th key={i} className="pb-2 pr-4 text-left text-[10px] font-bold text-stone-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {block.rows.map((row, i) => (
                <tr key={i} className="hover:bg-stone-800/20 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className={`py-3 pr-4 ${j === 0 ? 'font-bold text-stone-200' : 'text-stone-400'} text-sm`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'callout': {
      const style = CALLOUT_STYLES[block.variant] ?? CALLOUT_STYLES.info
      return (
        <div className={`flex gap-3 p-4 rounded-xl border ${style.bg}`}>
          <span className={`material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5 ${style.text}`}>
            {style.icon}
          </span>
          <div>
            <p className={`font-bold text-sm mb-1 ${style.text}`}>{block.title}</p>
            <p className="text-sm text-stone-400 leading-relaxed">{block.text}</p>
          </div>
        </div>
      )
    }

    case 'badges':
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${BADGE_COLORS[item.color]}`}>
                {item.label}
              </span>
              <span className="text-sm text-stone-400">{item.desc}</span>
            </div>
          ))}
        </div>
      )

    case 'steps':
      return (
        <div className="space-y-3">
          {block.items.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center
                              text-[10px] font-bold text-primary flex-shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="font-bold text-stone-200 text-sm">{step.title}</p>
                <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'code':
      return (
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed whitespace-pre">{block.code}</pre>
        </div>
      )

    case 'faq':
      return (
        <div className="space-y-4">
          {block.items.map((item, i) => (
            <div key={i} className="bg-stone-900/40 border border-stone-800 rounded-xl p-5">
              <p className="font-bold text-stone-200 text-sm mb-2 flex items-start gap-2">
                <span className="text-primary flex-shrink-0">Q.</span>
                {item.q}
              </p>
              <p className="text-sm text-stone-400 leading-relaxed flex items-start gap-2">
                <span className="text-stone-600 flex-shrink-0">R.</span>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'

export default function HelpPage() {
  const [active, setActive] = useState('overview')
  const current = SECTIONS.find(s => s.id === active) ?? SECTIONS[0]

  return (
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* Sidebar navigation */}
      <aside className="w-56 flex-shrink-0 border-r border-stone-800 bg-stone-900/30 p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
        <p className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-3 px-2">Sections</p>
        <nav className="space-y-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                active === s.id
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${active === s.id ? '' : 'text-stone-600'}`}
                style={active === s.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {s.icon}
              </span>
              {s.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenu */}
      <main className="flex-1 p-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {current.icon}
            </span>
            <h1 className="serif text-3xl text-stone-100">{current.title}</h1>
          </div>
          <div className="h-px bg-stone-800 mt-4" />
        </div>

        <div className="space-y-6">
          {current.content.map((block, i) => (
            <RenderBlock key={i} block={block} />
          ))}
        </div>

        {/* Navigation bas de page */}
        <div className="flex justify-between mt-12 pt-6 border-t border-stone-800">
          {SECTIONS.findIndex(s => s.id === active) > 0 ? (
            <button
              onClick={() => setActive(SECTIONS[SECTIONS.findIndex(s => s.id === active) - 1].id)}
              className="flex items-center gap-2 text-sm text-stone-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {SECTIONS[SECTIONS.findIndex(s => s.id === active) - 1].title}
            </button>
          ) : <div />}

          {SECTIONS.findIndex(s => s.id === active) < SECTIONS.length - 1 ? (
            <button
              onClick={() => setActive(SECTIONS[SECTIONS.findIndex(s => s.id === active) + 1].id)}
              className="flex items-center gap-2 text-sm text-stone-400 hover:text-primary transition-colors"
            >
              {SECTIONS[SECTIONS.findIndex(s => s.id === active) + 1].title}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : <div />}
        </div>
      </main>
    </div>
  )
}
