// ─────────────────────────────────────────────
//  INDICES & COMMODITIES
//
//  symbol    → Symbole Yahoo Finance (affichage)
//  apiSymbol → Symbole ETF proxy envoyé au backend
//              (les APIs free ne supportent pas ^GSPC, CL=F, etc.)
// ─────────────────────────────────────────────
export const INDICES = [
  {
    id: 'sp500',
    name: 'S&P 500',
    symbol: '^GSPC',
    apiSymbol: 'SPY',       // ETF SPDR S&P 500 — corrélation >0.999
    price: 5137.08,
    change: 41.74,
    changePct: 0.82,
    high: 5152.34,
    low: 5098.22,
    sparkline: [40, 55, 45, 70, 65, 85, 80, 100],
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    symbol: '^IXIC',
    apiSymbol: 'QQQ',       // ETF Invesco QQQ — corrélation >0.998
    price: 16274.94,
    change: 183.02,
    changePct: 1.14,
    high: 16311.20,
    low: 16098.44,
    sparkline: [30, 40, 60, 50, 80, 75, 95, 100],
  },
  {
    id: 'wti',
    name: 'WTI Crude',
    symbol: 'CL=F',
    apiSymbol: 'USO',       // ETF United States Oil Fund
    price: 79.97,
    change: -0.36,
    changePct: -0.45,
    high: 80.88,
    low: 79.44,
    sparkline: [90, 80, 70, 75, 60, 50, 45, 35],
  },
  {
    id: 'gold',
    name: 'Gold',
    symbol: 'GC=F',
    apiSymbol: 'GLD',       // ETF SPDR Gold Shares
    price: 2082.90,
    change: 2.50,
    changePct: 0.12,
    high: 2094.10,
    low: 2071.30,
    sparkline: [60, 65, 60, 70, 75, 72, 78, 82],
  },
]

// ─────────────────────────────────────────────
//  CHART HISTORY  (points pour chaque période)
// ─────────────────────────────────────────────
function makeHistory(base, n, vol, trend) {
  const pts = []
  let v = base
  for (let i = 0; i < n; i++) {
    v = v * (1 + trend / n) + (Math.random() - 0.47) * vol * v
    pts.push(parseFloat(v.toFixed(2)))
  }
  return pts
}

const BASES = { sp500: 5000, nasdaq: 15900, wti: 82, gold: 2060 }

export const CHART_DATA = {
  '1D': {
    labels: ['9:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00'],
    series: {
      sp500:  makeHistory(BASES.sp500,  14, 0.003, 0.008),
      nasdaq: makeHistory(BASES.nasdaq, 14, 0.004, 0.011),
      wti:    makeHistory(BASES.wti,    14, 0.003, -0.004),
      gold:   makeHistory(BASES.gold,   14, 0.002, 0.001),
    },
  },
  '1W': {
    labels: ['Lun','Mar','Mer','Jeu','Ven'],
    series: {
      sp500:  makeHistory(BASES.sp500,  5, 0.006, 0.017),
      nasdaq: makeHistory(BASES.nasdaq, 5, 0.007, 0.017),
      wti:    makeHistory(BASES.wti,    5, 0.005, -0.010),
      gold:   makeHistory(BASES.gold,   5, 0.003, 0.006),
    },
  },
  '1M': {
    labels: Array.from({length: 22}, (_, i) => {
      const d = new Date(2026, 2, 30)
      d.setDate(d.getDate() - (21 - i))
      return `${d.getDate()}/${d.getMonth() + 1}`
    }),
    series: {
      sp500:  makeHistory(BASES.sp500,  22, 0.008, 0.032),
      nasdaq: makeHistory(BASES.nasdaq, 22, 0.009, 0.030),
      wti:    makeHistory(BASES.wti,    22, 0.007, -0.025),
      gold:   makeHistory(BASES.gold,   22, 0.004, 0.016),
    },
  },
  '1Y': {
    labels: ['Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc','Jan','Fév','Mar'],
    series: {
      sp500:  makeHistory(BASES.sp500,  12, 0.015, 0.093),
      nasdaq: makeHistory(BASES.nasdaq, 12, 0.017, 0.123),
      wti:    makeHistory(BASES.wti,    12, 0.012, 0.025),
      gold:   makeHistory(BASES.gold,   12, 0.007, 0.052),
    },
  },
  'ALL': {
    labels: ['2021','2022','2023','2024','2025','2026'],
    series: {
      sp500:  makeHistory(BASES.sp500,  6, 0.02, 0.35),
      nasdaq: makeHistory(BASES.nasdaq, 6, 0.022, 0.25),
      wti:    makeHistory(BASES.wti,    6, 0.015, 0.11),
      gold:   makeHistory(BASES.gold,   6, 0.010, 0.16),
    },
  },
}

// ─────────────────────────────────────────────
//  WATCHLIST
// ─────────────────────────────────────────────
export const WATCHLIST = [
  { symbol: 'AAPL',  name: 'Apple Inc.',       price: 179.66, change: -1.09, changePct: -0.60, volume: '48.2M', sector: 'Technology',  sparkline: [90,85,88,80,75,72,70,65] },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',   price: 415.50, change:  1.86, changePct:  0.45, volume: '22.1M', sector: 'Technology',  sparkline: [60,62,65,63,68,70,72,75] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',     price: 138.08, change: -1.71, changePct: -1.22, volume: '31.7M', sector: 'Technology',  sparkline: [80,78,75,73,70,68,65,60] },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',      price: 822.79, change: 31.87, changePct:  4.00, volume: '61.4M', sector: 'Technology',  sparkline: [30,40,50,55,65,75,88,100] },
  { symbol: 'TSLA',  name: 'Tesla, Inc.',       price: 202.64, change:  0.77, changePct:  0.38, volume: '87.9M', sector: 'Automotive',  sparkline: [55,58,52,60,62,65,63,68] },
  { symbol: 'META',  name: 'Meta Platforms',    price: 521.33, change:  9.58, changePct:  1.87, volume: '18.3M', sector: 'Technology',  sparkline: [50,55,60,58,65,70,75,80] },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',   price: 186.22, change: -0.64, changePct: -0.34, volume: '29.5M', sector: 'Consumer',    sparkline: [70,68,72,70,68,65,63,62] },
  { symbol: 'BRK.B', name: 'Berkshire Hath.',   price: 405.12, change:  1.21, changePct:  0.30, volume: '4.1M',  sector: 'Finance',     sparkline: [60,62,63,65,64,66,67,68] },
  { symbol: 'JPM',   name: 'JP Morgan Chase',   price: 238.90, change:  2.14, changePct:  0.91, volume: '9.8M',  sector: 'Finance',     sparkline: [55,58,60,62,65,67,70,72] },
  { symbol: 'XOM',   name: 'Exxon Mobil Corp.', price: 111.44, change: -0.88, changePct: -0.78, volume: '14.2M', sector: 'Energy',      sparkline: [80,75,72,70,68,65,62,60] },
  { symbol: 'LLY',   name: 'Eli Lilly & Co.',   price: 897.25, change: 12.33, changePct:  1.39, volume: '3.2M',  sector: 'Healthcare',  sparkline: [40,48,52,58,65,72,80,88] },
  { symbol: 'V',     name: 'Visa Inc.',         price: 290.11, change:  1.05, changePct:  0.36, volume: '6.7M',  sector: 'Finance',     sparkline: [60,63,65,64,67,68,70,72] },
]

// ─────────────────────────────────────────────
//  MARKET NEWS
// ─────────────────────────────────────────────
export const NEWS = [
  {
    id: 1,
    tag: 'Breaking',
    tagColor: 'primary',
    ticker: '$NVDA',
    source: 'Bloomberg',
    time: '12m',
    title: 'Nvidia Projecting Record Revenue as AI Infrastructure Demand Surges Globally',
    summary: 'Technology analysts suggest that the semiconductor giant is poised to exceed quarterly expectations yet again, driven by massive investments from hyperscalers and emerging sovereign AI initiatives across Europe and Asia.',
    icon: '💹',
  },
  {
    id: 2,
    tag: 'Economics',
    tagColor: 'muted',
    ticker: 'MACRO',
    source: 'Reuters',
    time: '45m',
    title: 'Federal Reserve Signals Caution on Rate Cuts Amid Persistent Inflation Data',
    summary: 'Recent labor market strength provides the central bank more leeway to maintain current restrictive levels as they navigate the soft-landing path.',
    icon: '🏛️',
  },
  {
    id: 3,
    tag: 'Markets',
    tagColor: 'muted',
    ticker: '$AAPL',
    source: 'WSJ',
    time: '1h',
    title: 'Apple Explores Strategic Partnership With Regional Financial Hubs for Digital Wallet Expansion',
    summary: 'Sources close to the matter indicate that the tech titan is in late-stage talks with major banking consortia to integrate seamless cross-border settlement features.',
    icon: '🍎',
  },
  {
    id: 4,
    tag: 'Commodities',
    tagColor: 'gold',
    ticker: 'GC=F',
    source: 'FT',
    time: '2h',
    title: 'Gold Reaches Monthly High Driven by Central Bank Demand',
    summary: 'Purchases by emerging-market central banks remain robust, supporting prices even in the face of a stronger dollar and elevated real yields.',
    icon: '🥇',
  },
]

// ─────────────────────────────────────────────
//  ALERTS
// ─────────────────────────────────────────────
export const ALERTS = [
  { id: 1, symbol: 'NVDA', name: 'NVIDIA Corp.',    condition: 'Price Above', value: '$850.00', status: 'active',  channels: ['mail','notifications'] },
  { id: 2, symbol: 'AAPL', name: 'Apple Inc.',      condition: 'Volume >',    value: '1.2M',    status: 'paused',  channels: ['sms'] },
  { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.',     condition: '% Change >',  value: '5.0%',    status: 'active',  channels: ['mail','sms'] },
  { id: 4, symbol: 'META', name: 'Meta Platforms',  condition: 'Price Below', value: '$480.00', status: 'active',  channels: ['notifications'] },
  { id: 5, symbol: 'MSFT', name: 'Microsoft',       condition: 'Price Above', value: '$430.00', status: 'paused',  channels: ['mail'] },
]

// ─────────────────────────────────────────────
//  PORTFOLIO
// ─────────────────────────────────────────────
export const PORTFOLIO = [
  { symbol: 'AAPL',  name: 'Apple Inc.',         qty: 1240, avgCost: 142.10, price: 189.43, sector: 'Technology' },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation', qty: 450,  avgCost: 412.50, price: 875.28, sector: 'Technology' },
  { symbol: 'TSLA',  name: 'Tesla, Inc.',         qty: 820,  avgCost: 198.40, price: 175.60, sector: 'Automotive' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',     qty: 1100, avgCost: 128.90, price: 178.22, sector: 'Consumer'   },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',       qty: 980,  avgCost: 115.40, price: 148.95, sector: 'Technology' },
]
