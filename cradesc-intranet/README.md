# CRADESC — Kit de démarrage (Google / Firebase)

Suite numérique interne du CRADESC à déployer sur **Firebase / Google Workspace**.
Ce dépôt est le **point de départ du développeur** : configuration du projet, règles de
sécurité, squelettes de fonctions serveur et guides de mise en ligne.

Il accompagne deux documents de référence :

- **Dossier technique développeur** (Word) — modèle de données complet, spécifications
  des fonctions, règles de sécurité commentées, lots et critères de recette.
- **Note d'intégration API** (HTML) — schéma d'ensemble et cartographie écran → API.

> La **maquette HTML** (`CRADESC_Intranet.html`) reste la référence d'interface et de
> comportement : *l'écran fait foi*. Ce dépôt décrit comment la rendre réelle.

---

## Ce qui change entre la maquette et la production

| | Maquette (HTML) | Production (ce dépôt) |
|---|---|---|
| Données | En mémoire, jeux figés | **Cloud Firestore** — source unique de vérité |
| Communication inter-apps | `postMessage` entre iframes | **Firestore partagé** + Cloud Functions |
| Identité | Sélecteur de compte simulé | **Google Sign-In** (OAuth 2.0 / OIDC), restreint au domaine |
| Droits | Filtrage en façade (ouvert pour la démo) | **Custom claims** + **règles Firestore** |
| Agenda / e-mails | Aperçus simulés | **Calendar API** + **Gmail API** (via Cloud Functions) |
| Justificatifs | Non persistés | **Google Drive API** (Drive partagé) |
| Budget consolidé | Calcul en façade | **Cloud Function** (agrégation côté serveur) |

---

## Périmètre — 6 plateformes

Pilotage (programmes, projets, activités, tâches, budget **et revue** : réunions,
décisions, actions, points de vigilance) · Validation des TdR · Achats ·
Demandes de paiement · Ordres de mission · Tableau de bord direction.

> Il n'y a **pas** de plateforme « Coordination » distincte : ses fonctions sont
> portées par le module **Revue** de Pilotage.

---

## Arborescence

```
cradesc-firebase/
├── README.md                  ← vous êtes ici
├── firebase.json              Config Hosting + Functions + Firestore
├── .firebaserc                Alias du/des projet(s) Firebase
├── firestore.rules            Règles de sécurité par collection
├── firestore.indexes.json     Index composites
├── .gitignore
├── functions/                 Fonctions serveur (Node.js)
│   ├── package.json
│   ├── index.js               Point d'entrée — exporte les fonctions
│   └── src/
│       ├── roles.js           Attribution des rôles (custom claims)
│       ├── budget.js          Disponibilité budgétaire (agrégation)
│       ├── achats.js          Transitions de circuit + engagement
│       ├── paiements.js       Décaissement (transaction)
│       ├── missions.js        Passerelle avance → demande de paiement
│       ├── notifications.js   Relances Gmail + rappels Calendar
│       └── pdf.js             Génération documentaire (BC, OM)
├── hosting/                   Front (PWA) — y déposer la maquette adaptée
│   └── README.md
└── docs/
    ├── 01_setup_firebase.md       Créer le projet, activer les API, OAuth
    ├── 02_deploiement.md          Déployer règles, fonctions, hosting
    ├── 03_integration_maquette.md Brancher la maquette HTML sur Firebase
    └── 04_recette.md              Scénarios de recette de bout en bout
```

---

## Démarrage rapide

```bash
# 1. Outils
npm install -g firebase-tools
firebase login

# 2. Lier au projet (voir docs/01_setup_firebase.md)
firebase use --add        # sélectionner le projet créé dans la console

# 3. Dépendances des fonctions
cd functions && npm install && cd ..

# 4. Émulateur local (Firestore + Functions + Hosting)
firebase emulators:start

# 5. Déploiement
firebase deploy
```

La marche à suivre complète (création du projet, activation des API Google,
configuration OAuth et des secrets) est dans **`docs/01_setup_firebase.md`**.
