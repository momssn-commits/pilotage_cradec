# CRADESC — Intranet (application reconstruite)

Application web (PWA) reconstruite à partir des trois références fournies :
la **maquette** (`CRADESC_Intranet.html` — « l'écran fait foi »), le **dossier
technique développeur** (modèle de données, RBAC, fonctions, recette) et le
**kit de démarrage Firebase**. Le front a été **réécrit en modules** et branché
sur Firebase (Auth Google + Firestore + Cloud Functions), conformément au
dossier. Le tout est intégré dans ce dépôt prêt à déployer.

## Deux modes de fonctionnement

| | Mode démo (par défaut) | Mode réel |
|---|---|---|
| Déclenchement | `app/config.js` non renseigné, ou `?demo=1` | config renseignée, ou `?live=1`, ou émulateur |
| Connexion | sélecteur de compte simulé (4 profils, 5 rôles) | **Google Sign-In** restreint à `@cradesc.org` |
| Données | persistance locale (`localStorage`) + jeux de démo | **Cloud Firestore** |
| Actions sensibles | simulées en façade | **Cloud Functions** (`httpsCallable`) |
| Aperçus Gmail/Agenda/Drive | données figées | API Google via Cloud Function |

Le mode démo permet de **lancer et tester l'interface immédiatement**, sans
compte Google. Le passage en réel ne demande que de **renseigner la config**.

## Lancer en mode démo

```bash
cd hosting
python3 -m http.server 49643      # puis ouvrir http://localhost:49643
```
(ou, depuis le Finder, double-cliquer sur `Lancer CRADESC.command` à la racine.)

## Lancer en mode réel (émulateurs Firebase)

```bash
npm install -g firebase-tools
cd functions && npm install && cd ..
firebase emulators:start          # Auth + Firestore + Functions + Hosting
# dans un autre terminal, amorcer les référentiels :
cd functions && npm run seed
```
L'app servie par l'émulateur Hosting (port 5000) détecte `localhost` et se
connecte automatiquement aux émulateurs Auth/Firestore/Functions.

## Déployer en production

1. Créer le projet Firebase et renseigner `hosting/app/config.js`
   (cf. `docs/01_setup_firebase.md`).
2. Déployer dans l'ordre (cf. `docs/02_deploiement.md`) :
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   firebase deploy --only functions
   firebase deploy --only hosting
   ```
3. Amorcer les référentiels (`functions/seed.js` avec un compte de service).

## Architecture du front (`hosting/`)

```
index.html              Coquille + cadre plateforme (PWA)
manifest.webmanifest    PWA
service-worker.js       Cache de la coquille
styles/shell.css        Charte (extraite de la maquette)
assets/logo.js          Logo (data URI)
app/
  config.js             Config Firebase + détection démo/réel
  firebase.js           Init SDK (chargé seulement en mode réel)
  auth.js               Google Sign-In + restriction domaine + rôle (claim) ; démo
  rbac.js               Matrice d'accès §4.1, catalogue des plateformes
  data.js               Couche données Firestore (collections §7) + repli démo
  google.js             Aperçus Gmail/Agenda/Drive
  bus.js                Pont portail ↔ plateformes ; passerelle avance→paiement
  ui.js                 Helpers (icônes, échappement, toasts)
  shell.js              Login, accueil, lanceur, navigation, cadre plateforme
platforms/
  pilotage.html  tdr.html  achats.html  paiements.html  missions.html  direction.html
```

Les **6 plateformes** sont servies comme fichiers autonomes et chargées par le
portail en iframe. Le portail leur transmet la **session réelle** (rôle issu du
custom claim) et les **engagements consolidés** via le bus (`cradesc-context`),
en remplacement du `postMessage` simulé de la maquette. La **passerelle
avance → paiement** écrit dans `/avances` (ce qui déclenche la Cloud Function
`missions.avanceVersPaiement`) puis transmet l'avance à la plateforme paiements.

## Périmètre câblé / étapes suivantes

**Câblé de bout en bout :** portail (Auth Google + restriction domaine, RBAC en
façade *et* règles serveur, accueil + aperçus Google, lanceur), bus inter-apps,
passerelle avance→paiement (Firestore + Cloud Function), couche de données
Firestore (§7), Cloud Functions complétées (rôles, budget anti-double-comptage,
achats par seuils, décaissement avec contrôle de disponibilité, passerelle,
notifications, journal d'audit), règles, index, amorçage des référentiels, PWA.

**Étape suivante (gabarit Achats) :** la migration du *contenu interne* de
chaque plateforme (ses jeux de données embarqués) vers des lectures/écritures
Firestore. La couche `app/data.js`, les règles et les fonctions sont en place ;
le dossier (§12) désigne **Achats** comme gabarit, les autres plateformes
suivant le même patron. Les plateformes affichent aujourd'hui leur rendu de
référence, alimenté par la session réelle.
