#!/usr/bin/env bash
# ============================================================
# CRADESC — Mise en ligne sur le serveur (Traefik + Docker)
# Copie le projet sur le serveur en SSH puis (re)construit le conteneur.
# Vous serez invité·e à saisir le mot de passe SSH (deux fois : copie + build).
#
# Usage :
#   ./deploy/deploy.sh <user> <serveur> <domaine> [chemin_distant]
# Exemple :
#   ./deploy/deploy.sh deploy 187.124.52.164 intranet.cradesc.org
# ============================================================
set -euo pipefail

USER="${1:?user SSH manquant}"
HOST="${2:?serveur manquant}"
DOMAINE="${3:?domaine manquant (Traefik route par Host)}"
REMOTE_DIR="${4:-/opt/cradesc-intranet}"

# Racine du projet = dossier parent de ce script.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Envoi du projet vers ${USER}@${HOST}:${REMOTE_DIR} (mot de passe demandé)…"
# rsync sans node_modules ni .git ; -e ssh pour l'invite de mot de passe.
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude 'functions/node_modules' \
  -e "ssh -o StrictHostKeyChecking=accept-new" \
  "${ROOT}/" "${USER}@${HOST}:${REMOTE_DIR}/"

echo "→ Construction et démarrage du conteneur sur le serveur (mot de passe demandé)…"
ssh -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" \
  "cd ${REMOTE_DIR} && DOMAINE='${DOMAINE}' docker compose -f deploy/docker-compose.yml up -d --build"

echo "✓ Terminé. Le site sera servi par Traefik sur : https://${DOMAINE}"
echo "  (Vérifiez que ${DOMAINE} pointe en DNS vers ${HOST}.)"
