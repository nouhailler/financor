import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Alerts from './pages/Alerts.jsx'
import Portfolio from './pages/Portfolio.jsx'
import NewsPage from './pages/NewsPage.jsx'
import Settings from './pages/Settings.jsx'
import HelpPage from './pages/HelpPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="watchlist"  element={<Watchlist />} />
        <Route path="alerts"     element={<Alerts />} />
        <Route path="portfolio"  element={<Portfolio />} />
        <Route path="news"       element={<NewsPage />} />
        <Route path="settings"   element={<Settings />} />
        <Route path="help"       element={<HelpPage />} />
      </Route>
    </Routes>
  )
}
