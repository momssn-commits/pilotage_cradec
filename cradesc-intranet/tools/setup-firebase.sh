#!/usr/bin/env bash
# ============================================================
# CRADESC — Création du projet Firebase + génération de config.js + déploiement
# Authentification : jeton non-interactif (firebase login:ci).
#
#   FIREBASE_TOKEN="<jeton>" PROJECT_ID="cradesc-intranet" \
#     ADMIN_PASSWORD="mot-de-passe-fort" ./tools/setup-firebase.sh
#
# Étapes : crée le projet (si absent) → app web → écrit hosting/app/config.js
#          → déploie règles + index → (tente) functions → amorce le super-admin.
# ============================================================
set -uo pipefail

PROJECT_ID="${PROJECT_ID:-cradesc-intranet}"
DISPLAY_NAME="${DISPLAY_NAME:-CRADESC Intranet}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FB() { firebase --non-interactive "$@"; }

[ -z "${FIREBASE_TOKEN:-}" ] && { echo "✗ FIREBASE_TOKEN manquant (firebase login:ci)"; exit 1; }
export FIREBASE_TOKEN

echo "→ 1/6 Projet Firebase ($PROJECT_ID)…"
if FB projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
  echo "   projet déjà existant, on continue."
else
  FB projects:create "$PROJECT_ID" --display-name "$DISPLAY_NAME" || {
    echo "   (échec création — l'ID est peut-être pris ; réessayez avec un autre PROJECT_ID)"; exit 1; }
fi

echo "→ 2/6 Application web…"
APP_ID="$(FB apps:list WEB --project "$PROJECT_ID" 2>/dev/null | awk '/WEB/{print $4; exit}')"
if [ -z "$APP_ID" ]; then
  FB apps:create WEB "CRADESC Intranet" --project "$PROJECT_ID" >/dev/null 2>&1
  APP_ID="$(FB apps:list WEB --project "$PROJECT_ID" 2>/dev/null | awk '/WEB/{print $4; exit}')"
fi
echo "   appId = ${APP_ID:-(introuvable)}"

echo "→ 3/6 Récupération de la config SDK et écriture de hosting/app/config.js…"
FB apps:sdkconfig WEB "$APP_ID" --project "$PROJECT_ID" --json > /tmp/cradesc_sdk.json 2>/dev/null
node "$ROOT/tools/write-config.js" /tmp/cradesc_sdk.json "$ROOT/hosting/app/config.js" || {
  echo "   ✗ écriture config.js échouée"; exit 1; }
echo "   ✓ config.js renseigné."

echo "→ 4/6 Déploiement des règles et index Firestore…"
( cd "$ROOT" && FB deploy --only firestore:rules,firestore:indexes --project "$PROJECT_ID" ) \
  || echo "   ! règles/index : échec (Firestore activé dans la console ?)"

echo "→ 5/6 Déploiement des Cloud Functions (nécessite le plan Blaze)…"
( cd "$ROOT/functions" && npm install --no-audit --no-fund >/dev/null 2>&1 )
( cd "$ROOT" && FB deploy --only functions --project "$PROJECT_ID" ) \
  || echo "   ! functions : échec (activez la facturation Blaze dans la console, puis relancez)."

echo "→ 6/6 Super-administrateur (momssn@gmail.com)…"
if [ -n "${ADMIN_PASSWORD:-}" ]; then
  ( cd "$ROOT/functions" && GCLOUD_PROJECT="$PROJECT_ID" GOOGLE_CLOUD_PROJECT="$PROJECT_ID" \
      ADMIN_PASSWORD="$ADMIN_PASSWORD" node seed.js --project="$PROJECT_ID" ) \
    || echo "   ! amorçage : nécessite des identifiants Admin (clé de service) — voir le runbook."
else
  echo "   (ADMIN_PASSWORD non fourni — amorçage à lancer séparément.)"
fi

echo
echo "Terminé. À vérifier dans la console Firebase :"
echo "  • Authentication → activer le fournisseur « E-mail/Mot de passe »"
echo "  • Firestore → créer la base (mode production) si pas déjà fait"
echo "  • Plan Blaze activé si les Cloud Functions sont requises"
