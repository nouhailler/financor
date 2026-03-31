import { NEWS } from '../data/mockData.js'

const TAG_STYLES = {
  primary: 'bg-primary/10 text-primary',
  gold:    'bg-amber-500/10 text-amber-500',
  muted:   'bg-stone-800 text-stone-400',
}

export default function NewsPage() {
  const extended = [
    ...NEWS,
    {
      id: 5, tag: 'Tech', tagColor: 'muted', ticker: '$MSFT', source: 'WSJ', time: '2h',
      title: 'Central Bank Policy Shift Triggers Rotation Into Value Stocks and Commodities',
      summary: 'As inflation markers stabilize, institutional investors are beginning to pivot away from high-growth tech toward traditional industrial and energy sectors.',
      icon: '📊',
    },
    {
      id: 6, tag: 'Crypto', tagColor: 'gold', ticker: 'BTC', source: 'CoinDesk', time: '3h',
      title: 'Bitcoin Consolidates Near $95K as ETF Flows Remain Elevated',
      summary: 'Spot Bitcoin ETFs recorded another week of net inflows, underpinning demand even as on-chain metrics signal near-term caution among long-term holders.',
      icon: '₿',
    },
  ]

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-3">
            <span>Intelligence</span>
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            <span className="text-stone-500">Marchés mondiaux</span>
          </nav>
          <h2 className="serif text-6xl text-primary leading-tight">Market News</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrer
          </button>
          <button className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Résumé IA
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-5">
        {extended.map(a => (
          <article
            key={a.id}
            className="group bg-stone-900/40 border border-stone-800/60 rounded-xl p-8
                       hover:bg-stone-900/60 transition-all duration-300 hover:border-stone-700 cursor-pointer"
          >
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 order-2 md:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${TAG_STYLES[a.tagColor]}`}>
                    {a.ticker}
                  </span>
                  <span className="text-xs text-stone-500">{a.source} · {a.time} ago</span>
                </div>
                <h3 className="serif text-2xl text-stone-100 mb-3 group-hover:text-primary transition-colors leading-tight">
                  {a.title}
                </h3>
                <p className="text-stone-400 text-sm leading-relaxed mb-5 line-clamp-3">
                  {a.summary}
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-stone-500">
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">share</span> Partager
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">bookmark</span> Sauvegarder
                  </button>
                </div>
              </div>
              <div className="w-full md:w-44 h-36 md:h-28 shrink-0 rounded-lg bg-stone-800 order-1 md:order-2
                              flex items-center justify-center text-4xl transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                {a.icon}
              </div>
            </div>
          </article>
        ))}

        <div className="pt-6 flex justify-center">
          <button className="px-8 py-3 bg-transparent border-2 border-stone-800 hover:border-primary
                             hover:text-primary text-stone-400 rounded-full text-sm font-bold transition-all flex items-center gap-2">
            Charger plus d'articles
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </div>
    </div>
  )
}
