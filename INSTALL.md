# Installation de Financor

## Installation rapide — Debian / Ubuntu

### 1. Télécharger le paquet

Depuis la [page des releases](https://github.com/nouhailler/financor/releases/latest) :

```bash
wget https://github.com/nouhailler/financor/releases/download/v1.0.0/financor_1.0.0_all.deb
```

### 2. Installer

```bash
sudo dpkg -i financor_1.0.0_all.deb

# Si des dépendances manquent :
sudo apt-get install -f
```

### 3. Configurer les clés API

```bash
sudo cp /usr/share/financor/backend/.env.example /usr/share/financor/backend/.env
sudo nano /usr/share/financor/backend/.env
```

Renseignez au minimum **une** clé (Finnhub recommandé — inscription gratuite) :

```env
FINNHUB_KEY=votre_cle_ici
```

### 4. Lancer

```bash
financor
```

L'application s'ouvre automatiquement à **http://localhost:8000**.
Au premier lancement, la construction du frontend prend ~30 secondes.

---

## Obtenir les clés API (toutes gratuites)

| Provider | URL | Limite | Priorité |
|---|---|---|---|
| **Finnhub** ⭐ | https://finnhub.io/register | 60 req/min — temps réel | 1 |
| Twelve Data | https://twelvedata.com/register | 8 req/min — ~15 min | 2 |
| FMP | https://site.financialmodelingprep.com/register | 250 req/jour | 3 |
| Alpha Vantage | https://www.alphavantage.co/support/#api-key | 25 req/jour | 4 |

L'application fonctionne avec n'importe quelle combinaison — le Smart Router bascule automatiquement vers un provider disponible en cas de limite atteinte.

---

## Installation depuis les sources

### Prérequis

- Python 3.10+ avec `pip` et `venv`
- Node.js 18+ avec `npm`
- Git

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/nouhailler/financor.git
cd financor

# 2. Configurer le backend
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
nano .env          # Ajouter vos clés API

# 3. Démarrer le backend (Terminal 1)
./start.sh         # → http://localhost:8000

# 4. Démarrer le frontend (Terminal 2)
cd ..
npm install
npm run dev        # → http://localhost:5173
```

---

## Désinstallation

```bash
sudo dpkg -r financor
# Les fichiers de config dans /usr/share/financor/backend/.env sont conservés
# Pour tout supprimer :
sudo rm -rf /usr/share/financor
```

---

## Dépendances système

| Composant | Version requise |
|---|---|
| Debian / Ubuntu | ≥ 11 (Bullseye) / ≥ 20.04 |
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| npm | inclus avec Node.js |

## Dépendances Python (installées automatiquement)

| Package | Version |
|---|---|
| fastapi | 0.115.5 |
| uvicorn[standard] | 0.32.1 |
| httpx | 0.28.0 |
| pydantic | 2.10.2 |
| pydantic-settings | 2.6.1 |
| python-dotenv | 1.0.1 |

## Dépendances Node (installées automatiquement)

| Package | Version |
|---|---|
| react | ^18.3.1 |
| react-router-dom | ^6.27.0 |
| recharts | ^2.13.3 |
| lucide-react | ^0.454.0 |
| vite | ^5.4.10 |
| tailwindcss | ^3.4.14 |
