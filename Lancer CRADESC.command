#!/bin/zsh
# Lance l'intranet CRADESC en MODE DÉMO (serveur statique local).
# Données simulées — aucun compte Google requis. Pour le mode réel
# (Firebase), voir cradesc-intranet/docs/ et lancer « firebase emulators:start ».
cd "$(dirname "$0")/cradesc-intranet/hosting"

PORT=49643
if lsof -i :$PORT >/dev/null 2>&1; then
  open "http://localhost:$PORT"
  exit 0
fi
open "http://localhost:$PORT" &
exec python3 -m http.server $PORT
