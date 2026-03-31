# Financor — Terminal Boursier Open Source

> Tableau de bord financier moderne, conçu pour le grand public.  
> Données réelles via plusieurs fournisseurs gratuits, avec bascule automatique en cas de panne.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Stack](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)
![Stack](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/licence-MIT-green)

---

## ✨ Ce que fait Financor

Financor est une application web de suivi des marchés financiers qui affiche :

- **Les grands indices mondiaux** — S&P 500, NASDAQ, pétrole WTI, or
- **Une watchlist personnalisable** — 12 titres (AAPL, MSFT, NVDA, TSLA…)
- **Des graphiques interactifs** — historique sur 1 jour à 5 ans
- **Les actualités du marché** — fil d'articles financiers
- **La gestion des alertes** — seuils de prix configurables
- **Le suivi de portefeuille** — valeur totale, P&L, allocation sectorielle

Les données proviennent de plusieurs APIs gratuites avec **bascule automatique** entre fournisseurs si l'un d'eux est indisponible ou a atteint sa limite.

---

## 🏗️ Architecture

```
Financor
├── app/                    ← Racine du projet
│   ├── src/                ← Frontend React
│   │   ├── pages/          ← 6 pages (Dashboard, Watchlist, Alertes…)
│   │   ├── components/     ← Composants réutilisables
│   │   ├── hooks/          ← Logique de fetch et d'état
│   │   └── data/           ← Données mock (fallback)
│   └── backend/            ← API Python FastAPI
│       ├── providers/      ← Un fichier par fournisseur de données
│       ├── router.py       ← Smart Router (failover + circuit breaker)
│       └── main.py         ← Point d'entrée FastAPI
```

### Comment les deux parties communiquent

```
Navigateur (React + Vite)
        │
        │  /api/quote/AAPL        ← Le frontend ne connaît que /api/*
        │  /api/history/SPY
        │  /api/providers/status
        ▼
   Proxy Vite (dev) / Nginx (prod)
        │
        ▼
   Backend FastAPI :8000
        │
        ├── Finnhub     (P1 — temps réel, 60 req/min)
        ├── Twelve Data (P2 — 8 req/min, 15 min delay)
        ├── FMP         (P3 — 250 req/jour)
        └── Alpha Vantage (P4 — 25 req/jour, secours)
```

---

## 🚀 Installation et démarrage

### Prérequis

- **Node.js** ≥ 18 — `node --version`
- **Python** ≥ 3.11 — `python3 --version`
- Au moins **une clé API gratuite** (voir section [Sources de données](#-sources-de-données))

### 1. Cloner le dépôt

```bash
git clone https://github.com/nouhailler/financor.git
cd financor/app
```

### 2. Démarrer le backend

```bash
cd backend
chmod +x start.sh   # une seule fois
./start.sh
```

Le script crée automatiquement un environnement virtuel Python, installe les dépendances, et lance le serveur sur `http://localhost:8000`.

> **Sans clé API ?** L'application fonctionne quand même avec des données simulées réalistes. Configure au moins une clé pour obtenir des données réelles.

Pour configurer les clés :

```bash
# Copier le modèle
cp .env.example .env

# Éditer avec ton éditeur favori
nano .env
```

### 3. Démarrer le frontend

```bash
# Depuis le dossier app/
cd ..
npm install
npm run dev
```

Ouvre **http://localhost:5173** dans ton navigateur.

---

## 🔑 Sources de données

Toutes les clés sont **gratuites**. Inscris-toi sur un ou plusieurs fournisseurs :

| Fournisseur | Lien | Limite free | Délai | Priorité |
|---|---|---|---|---|
| Finnhub | [finnhub.io/register](https://finnhub.io/register) | 60 req/min | Temps réel | ⚡ 1 |
| Twelve Data | [twelvedata.com](https://twelvedata.com/register) | 8 req/min | ~15 min | 📊 2 |
| Financial Modeling Prep | [financialmodelingprep.com](https://site.financialmodelingprep.com/register) | 250 req/jour | ~15 min | 📈 3 |
| Alpha Vantage | [alphavantage.co](https://www.alphavantage.co/support/#api-key) | 25 req/jour | ~20 min | 🔬 4 |

> **Recommandation :** commence avec **Finnhub** seul, c'est le plus généreux et le seul à offrir des données temps réel.

### Symboles proxies

Les APIs gratuites ne supportent pas les symboles Yahoo Finance pour les indices (`^GSPC`, `CL=F`…). Financor utilise automatiquement des **ETF équivalents** :

| Affiché | Symbole API | ETF utilisé |
|---|---|---|
| S&P 500 | ^GSPC | SPY (SPDR S&P 500) |
| NASDAQ | ^IXIC | QQQ (Invesco Nasdaq) |
| WTI Pétrole | CL=F | USO (US Oil Fund) |
| Or | GC=F | GLD (SPDR Gold) |

Les variations en % restent fidèles aux indices réels (corrélation > 0.998).

---

## 🧠 Le système Smart Router

Le cœur du backend est le `ProviderRouter` — il garantit la disponibilité des données même si un fournisseur est en panne.

### Circuit Breaker

Chaque fournisseur a son propre **disjoncteur** :

```
État CLOSED (normal)
    │ 5 échecs consécutifs
    ▼
État OPEN (en panne — 60s d'attente)
    │ 60s écoulées
    ▼
État HALF-OPEN (test)
    │ succès → CLOSED / échec → OPEN
```

### Failover automatique

```
Requête → Finnhub ──✓─→ Réponse
                   ──✗─→ Twelve Data ──✓─→ Réponse
                                      ──✗─→ FMP ──✓─→ Réponse
                                                 ──✗─→ Données simulées
```

### Rate Limit Tracker

Le router compte les requêtes par fenêtre glissante (minute et journée) et ignore automatiquement un fournisseur qui approche sa limite.

---

## 📁 Structure détaillée du code

### Frontend (`src/`)

```
src/
├── App.jsx                  # Routeur principal (React Router v6)
├── main.jsx                 # Point d'entrée React
├── index.css                # Styles globaux + variables Tailwind
│
├── data/
│   └── mockData.js          # Données de fallback (indices, watchlist, news…)
│
├── hooks/
│   ├── useBackend.js        # Détecte si le backend est accessible
│   ├── useStockData.js      # Fetch d'une cotation + polling 60s
│   └── useProviderStatus.js # État de santé des providers
│
├── components/
│   ├── Layout.jsx           # Sidebar + TopNav (communs à toutes les pages)
│   ├── ProviderSelector.jsx # Sélecteur de fournisseur (compact + étendu)
│   └── DataSourceBar.jsx    # Barre de fraîcheur des données
│
└── pages/
    ├── Dashboard.jsx        # Page principale
    ├── Watchlist.jsx        # Liste des titres suivis
    ├── Alerts.jsx           # Gestion des alertes de prix
    ├── Portfolio.jsx        # Suivi du portefeuille
    ├── NewsPage.jsx         # Fil d'actualités
    └── Settings.jsx         # Paramètres + config providers
```

### Backend (`backend/`)

```
backend/
├── main.py                  # FastAPI — définition des routes
├── config.py                # Chargement des variables d'environnement
├── schemas.py               # Modèles Pydantic (StockQuote, ProviderStatus…)
├── router.py                # Smart Router (Circuit Breaker + Rate Tracker)
│
├── providers/
│   ├── base.py              # Classe abstraite BaseProvider
│   ├── finnhub.py           # Implémentation Finnhub
│   ├── twelve_data.py       # Implémentation Twelve Data
│   ├── fmp.py               # Implémentation FMP
│   └── alpha_vantage.py     # Implémentation Alpha Vantage
│
├── requirements.txt         # Dépendances Python
├── .env.example             # Modèle de configuration
└── start.sh                 # Script de démarrage (crée le venv automatiquement)
```

### Endpoints API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Vérification que le backend tourne |
| `GET` | `/api/quote/{symbol}` | Cotation d'un titre (`?provider=finnhub` optionnel) |
| `GET` | `/api/history/{symbol}` | Historique (`?period=1M&provider=auto`) |
| `GET` | `/api/providers/status` | État de santé de tous les fournisseurs |
| `PATCH` | `/api/providers/config` | Modifier la configuration du router |

Documentation Swagger interactive : **http://localhost:8000/docs**

---

## 🎨 Design System

Financor utilise un design "Bloomberg Terminal modernisé" :

- **Fond** : `#0c0a09` (stone-950 très sombre)
- **Couleur primaire** : `#c2652a` (sienna chaud)
- **Typographie** : EB Garamond (titres serif) + Manrope (corps)
- **Données positives** : vert émeraude `#10b981`
- **Données négatives** : rouge `#ef4444`

---

## 🔄 Fraîcheur des données

L'application affiche toujours la source et l'âge des données :

| Badge | Signification |
|---|---|
| 🟢 À jour | Données de moins de 5 minutes |
| 🟡 X min | Données différées (15-20 min selon le provider) |
| 🔴 X min | Données anciennes (> 20 minutes) |
| ⚪ Simulé | Backend non connecté, données de démonstration |

---

## 🛠️ Développement

```bash
# Lancer les deux services en parallèle
cd backend && ./start.sh &
cd .. && npm run dev

# Build de production du frontend
npm run build
npm run preview
```

---

## 📄 Licence

MIT — libre d'utilisation, de modification et de distribution.

---

*Financor n'est pas un outil de trading professionnel. Les données peuvent être retardées. Ne prenez pas de décisions financières basées uniquement sur cette application.*
