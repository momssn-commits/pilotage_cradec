# 02 — Déploiement

## Pré-requis
- Node.js 20, `firebase-tools` installé (`npm i -g firebase-tools`), `firebase login`.
- Projet configuré (voir `01_setup_firebase.md`) et reporté dans `.firebaserc`.

## Local (émulateur) avant tout déploiement
```bash
cd functions && npm install && cd ..
firebase emulators:start          # Firestore + Functions + Hosting + Auth
```
Tester les parcours dans l'UI de l'émulateur avant de pousser quoi que ce soit.

## Déploiement par briques
```bash
firebase deploy --only firestore:rules        # règles de sécurité
firebase deploy --only firestore:indexes      # index composites
firebase deploy --only functions              # fonctions serveur
firebase deploy --only hosting                # front (PWA)
```
Ou tout d'un coup : `firebase deploy`.

## Ordre conseillé pour une première mise en ligne
1. Référentiels (agents, programmes, projets) — voir setup §6.
2. Règles + index.
3. Fonctions (`roles` en premier : sans rôle, les règles bloquent tout).
4. Hosting.
5. Recette de bout en bout (`04_recette.md`).

## Domaine
Associer le domaine du CRADESC dans **Hosting → Domaines personnalisés**.
