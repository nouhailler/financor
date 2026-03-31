#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  start.sh — Lance le backend Financor dans un venv isolé
#  Usage : ./start.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR="$SCRIPT_DIR/.venv"

# ── 1. Créer le venv si absent ────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Création de l'environnement virtuel Python..."
    python3 -m venv "$VENV_DIR"
    echo "✅ Venv créé dans $VENV_DIR"
fi

# ── 2. Activer le venv ────────────────────────────────────────────────────────
source "$VENV_DIR/bin/activate"

# ── 3. Installer / mettre à jour les dépendances ─────────────────────────────
echo "📥 Vérification des dépendances..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dépendances OK"

# ── 4. Vérifier que .env existe ───────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env absent — copie depuis .env.example"
    cp .env.example .env
    echo "👉 Édite .env pour ajouter tes clés API, puis relance ce script."
    echo "   nano .env"
    exit 1
fi

# ── 5. Lancer uvicorn ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       Financor API — Backend Multi-Provider          ║"
echo "║  http://localhost:8000                               ║"
echo "║  Swagger UI : http://localhost:8000/docs             ║"
echo "║  Ctrl+C pour arrêter                                 ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

uvicorn main:app --reload --port 8000 --host 0.0.0.0
