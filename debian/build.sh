#!/bin/bash
# build.sh — Construit le paquet Debian financor_1.0.0_all.deb
# Usage : bash debian/build.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="/tmp/financor-deb-build"
VERSION="1.0.0"
PKG_NAME="financor_${VERSION}_all"
PKG_DIR="$BUILD_DIR/$PKG_NAME"
OUTPUT_DEB="$REPO_ROOT/financor_${VERSION}_all.deb"

echo "═══════════════════════════════════════════════════"
echo "  Build Financor .deb v$VERSION"
echo "═══════════════════════════════════════════════════"

# ── Nettoyer ─────────────────────────────────────────────────────────────────
rm -rf "$PKG_DIR"
mkdir -p \
    "$PKG_DIR/DEBIAN" \
    "$PKG_DIR/usr/share/financor/frontend" \
    "$PKG_DIR/usr/share/financor/backend" \
    "$PKG_DIR/usr/local/bin" \
    "$PKG_DIR/usr/share/applications" \
    "$PKG_DIR/usr/share/icons/hicolor/scalable/apps" \
    "$PKG_DIR/usr/share/doc/financor"

# ── Frontend source ───────────────────────────────────────────────────────────
echo "  Copie du frontend..."
rsync -a \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.vite' \
    "$REPO_ROOT/src" \
    "$REPO_ROOT/public" \
    "$PKG_DIR/usr/share/financor/frontend/" 2>/dev/null || true

for f in package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js index.html; do
    [ -f "$REPO_ROOT/$f" ] && cp "$REPO_ROOT/$f" "$PKG_DIR/usr/share/financor/frontend/"
done

# ── Backend source ────────────────────────────────────────────────────────────
echo "  Copie du backend..."
rsync -a \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    "$REPO_ROOT/backend/" \
    "$PKG_DIR/usr/share/financor/backend/"

# ── Fichiers DEBIAN ───────────────────────────────────────────────────────────
echo "  Fichiers de contrôle..."

# Calculer la taille installée
INSTALLED_SIZE=$(du -sk "$PKG_DIR/usr" | cut -f1)
sed "s/^Installed-Size:.*/Installed-Size: $INSTALLED_SIZE/" \
    "$SCRIPT_DIR/control" > "$PKG_DIR/DEBIAN/control"

cp "$SCRIPT_DIR/postinst" "$PKG_DIR/DEBIAN/postinst"
chmod 755 "$PKG_DIR/DEBIAN/postinst"

# ── Launcher /usr/local/bin/financor ─────────────────────────────────────────
cp "$SCRIPT_DIR/financor.launcher" "$PKG_DIR/usr/local/bin/financor"
chmod 755 "$PKG_DIR/usr/local/bin/financor"

# ── .desktop ─────────────────────────────────────────────────────────────────
cp "$SCRIPT_DIR/financor.desktop" "$PKG_DIR/usr/share/applications/"

# ── Icône SVG ────────────────────────────────────────────────────────────────
cp "$REPO_ROOT/assets/financor.svg" \
    "$PKG_DIR/usr/share/icons/hicolor/scalable/apps/financor.svg"

# ── Changelog (requis) ────────────────────────────────────────────────────────
cat > /tmp/financor-changelog << EOF
financor (1.0.0) stable; urgency=medium

  * Version initiale — Release v1.0.0
  * Dashboard boursier avec données en temps réel
  * Multi-provider : Finnhub, Twelve Data, FMP, Alpha Vantage
  * Smart Router avec Circuit Breaker et failover automatique
  * Interface React 18 + Vite + Tailwind (design Sahara Trade)
  * Backend FastAPI + Python 3.13

 -- Financor Contributors <noreply@github.com>  $(date -R)
EOF
gzip -9c /tmp/financor-changelog > "$PKG_DIR/usr/share/doc/financor/changelog.Debian.gz"

# ── Copyright ─────────────────────────────────────────────────────────────────
cat > "$PKG_DIR/usr/share/doc/financor/copyright" << EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: financor
Upstream-Contact: https://github.com/nouhailler/financor
Source: https://github.com/nouhailler/financor

Files: *
Copyright: 2026 Financor Contributors
License: MIT
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 .
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 .
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
EOF

# ── Build .deb ────────────────────────────────────────────────────────────────
echo "  Construction du paquet .deb..."
dpkg-deb --build --root-owner-group "$PKG_DIR" "$OUTPUT_DEB"

echo ""
echo "  ✓ Paquet créé : $OUTPUT_DEB"
echo "  ✓ Taille      : $(du -h "$OUTPUT_DEB" | cut -f1)"
echo ""
echo "  Installer avec : sudo dpkg -i financor_${VERSION}_all.deb"
echo "═══════════════════════════════════════════════════"
