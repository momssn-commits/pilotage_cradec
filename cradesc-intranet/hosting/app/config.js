/* ============================================================
   CRADESC — Configuration du projet Firebase
   ------------------------------------------------------------
   Renseignez ces valeurs depuis la console Firebase :
   Paramètres du projet → Vos applications → Configuration du SDK.

   Tant que `apiKey` reste la valeur « __… __ » de gabarit, l'application
   démarre en MODE DÉMO : sélecteur de compte simulé + données de
   démonstration en mémoire (aucun appel réseau). Dès que la config est
   renseignée (ou en émulateur), l'application bascule en mode réel :
   Google Sign-In + Cloud Firestore + Cloud Functions.
   ============================================================ */

export const firebaseConfig = {
  apiKey: "__API_KEY__",
  authDomain: "cradesc-intranet.firebaseapp.com",
  projectId: "cradesc-intranet",
  storageBucket: "cradesc-intranet.appspot.com",
  messagingSenderId: "__SENDER_ID__",
  appId: "__APP_ID__",
};

/* Domaine professionnel autorisé (cf. Dossier technique §4). */
export const DOMAINE_AUTORISE = "cradesc.org";

/* Région des Cloud Functions (cf. Dossier technique §14 — région des données). */
export const FUNCTIONS_REGION = "europe-west1";

/* Détection du mode démo : config non renseignée. */
export const CONFIG_RENSEIGNEE =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("__");

/* Forçage manuel : ?demo=1 (démo) ou ?live=1 (réel) dans l'URL. */
const params = new URLSearchParams(location.search);
export const DEMO =
  params.get("demo") === "1" ? true
  : params.get("live") === "1" ? false
  : !CONFIG_RENSEIGNEE;

/* Connexion à l'émulateur local si on tourne sur localhost en mode réel. */
export const USE_EMULATORS =
  !DEMO && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
