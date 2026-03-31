import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard',            label: 'Dashboard' },
  { to: '/alerts',    icon: 'notifications_active',  label: 'Alertes' },
  { to: '/portfolio', icon: 'pie_chart',             label: 'Portefeuille' },
  { to: '/watchlist', icon: 'star',                  label: 'Watchlist' },
  { to: '/news',      icon: 'newspaper',             label: 'Actualités' },
  { to: '/settings',  icon: 'settings',              label: 'Paramètres' },
]

function MarketClock() {
  const now = new Date()
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const h = est.getHours(), m = est.getMinutes(), day = est.getDay()
  const isOpen = day >= 1 && day <= 5 && (h > 9 || (h === 9 && m >= 30)) && h < 16
  return (
    <div className="mx-3 mb-3 p-3 rounded-xl bg-surface-card border border-border">
      <p className="text-xs text-on-surface-3 mb-1 uppercase tracking-widest font-bold">Market Status</p>
      <div className="flex items-center gap-2">
        <span
          className="glow-dot w-2 h-2 rounded-full"
          style={{ background: isOpen ? '#10b981' : '#ef4444', color: isOpen ? '#10b981' : '#ef4444' }}
        />
        <span className="text-xs font-bold uppercase tracking-tight text-on-surface">
          {isOpen ? 'Open' : 'Closed'} • NYSE
        </span>
      </div>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const [searchVal, setSearchVal] = useState('')
  const currentPage = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-[#0f0e0d] border-r border-border z-50">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <h1 className="serif text-2xl text-primary tracking-tight">Financor</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-3 mt-0.5">Financial Terminal</p>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 pt-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ` +
                (isActive
                  ? 'text-primary bg-primary/10 border-r-4 border-primary font-bold rounded-r-none mr-0 pr-[calc(1rem-4px)]'
                  : 'text-on-surface-2 hover:bg-surface-high hover:text-on-surface')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 500" } : {}}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Aide — séparée en bas */}
        <div className="px-2 pb-2">
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ` +
              (isActive
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-on-surface-3 hover:bg-surface-high hover:text-on-surface-2')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  help
                </span>
                <span>Aide & Documentation</span>
              </>
            )}
          </NavLink>
        </div>

        <MarketClock />
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">

        {/* ── TOP NAV ── */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6
                           bg-[#0f0e0d]/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-6">
            <span className="serif text-xl text-primary hidden md:block">
              {location.pathname === '/help' ? 'Aide & Documentation' : currentPage?.label || 'Financor'}
            </span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-3 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search markets, tickers..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="bg-surface-card border border-border rounded-full pl-9 pr-4 py-1.5
                           text-sm w-64 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30
                           text-on-surface placeholder:text-on-surface-3 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <nav className="hidden lg:flex gap-1">
              {[
                { to: '/dashboard', label: 'Markets' },
                { to: '/news',      label: 'News' },
                { to: '/portfolio', label: 'Analysis' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `serif text-lg px-2 py-0.5 font-bold transition-colors ` +
                    (isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-2 hover:text-primary')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Lien aide dans le header */}
            <NavLink
              to="/help"
              title="Aide & Documentation"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-all ` +
                (isActive ? 'text-primary bg-primary/10' : 'text-on-surface-3 hover:text-on-surface hover:bg-surface-high')
              }
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </NavLink>
          </div>
        </header>

        {/* ── PAGE ── */}
        <main className="flex-1 bg-stone-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
