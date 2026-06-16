# 01 — Mise en place du projet Firebase / Google

Objectif : disposer d'un projet opérationnel (Firestore, Authentication, Functions,
Hosting) connecté à Google Workspace.

## 1. Créer le projet

1. Console Firebase → **Ajouter un projet** (ex. `cradesc-intranet`).
2. Reporter l'identifiant du projet dans **`.firebaserc`**.
3. Choisir la **région des données** (ex. `eur3`) — voir le dossier de déploiement
   pour les considérations de conformité (CDP, transfert hors UE).

## 2. Activer les services

- **Authentication** → activer **Google** comme fournisseur.
  Restreindre au domaine `cradesc.org` (Blocking functions : voir `roles.js`).
- **Firestore** → créer la base en mode **production**.
- **Functions** et **Hosting** → activés au premier déploiement.

## 3. API Google à activer (console Google Cloud du même projet)

| API | Usage |
|---|---|
| Google People / Identity | Connexion, profil |
| Google Drive API | Justificatifs, livrables |
| Gmail API | Envoi des bons de commande, relances |
| Google Calendar API | Rappels d'échéance |
| Admin SDK (Directory) | Synchronisation de l'annuaire des agents (optionnel) |

## 4. OAuth & écran de consentement

1. **Écran de consentement OAuth** → interne (réservé au domaine).
2. **Scopes** minimaux requis :
   - `openid email profile`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar.events`
3. Créer un **ID client OAuth** (application Web) et l'enregistrer côté front.

## 5. Compte de service & délégation domaine (pour Gmail/Calendar au nom de l'org)

Les envois « au nom de l'organisation » nécessitent un **compte de service** avec
**délégation à l'échelle du domaine**, autorisé dans la console Admin Google
Workspace pour les scopes Gmail/Calendar. Stocker sa clé en **secret** :

```bash
firebase functions:secrets:set GOOGLE_SA_KEY
firebase functions:secrets:set GMAIL_SENDER     # ex. no-reply@cradesc.org
```

> Ne jamais committer de secret. Voir `.gitignore` et `.env.example` si un fichier
> d'environnement local est utilisé pour l'émulateur.

## 6. Données de référence

Alimenter les collections `agents`, `programmes`, `projets` (référentiels) avant la
première recette. Un script d'amorçage peut être ajouté sous `functions/` ou via
l'émulateur Firestore.
