/* ============================================================
   CRADESC — Initialisation du SDK Firebase (modulaire, v10)
   Expose : app, auth, db, functions. En mode démo, ces objets
   restent nuls et la couche data/auth utilise les jeux simulés.
   ============================================================ */
import { firebaseConfig, DEMO, USE_EMULATORS, FUNCTIONS_REGION } from "./config.js";

let app = null, auth = null, db = null, functions = null;

/* Helpers chargés dynamiquement (uniquement en mode réel) afin que le
   mode démo n'ait aucune dépendance réseau. */
let _sdk = null;

export async function initFirebase() {
  if (DEMO) return { app: null, auth: null, db: null, functions: null, demo: true };
  if (app) return { app, auth, db, functions, demo: false };

  const [{ initializeApp }, authMod, fsMod, fnMod] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js"),
  ]);

  app = initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  db = fsMod.getFirestore(app);
  functions = fnMod.getFunctions(app, FUNCTIONS_REGION);
  _sdk = { auth: authMod, fs: fsMod, fn: fnMod };

  if (USE_EMULATORS) {
    try {
      authMod.connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      fsMod.connectFirestoreEmulator(db, "localhost", 8080);
      fnMod.connectFunctionsEmulator(functions, "localhost", 5001);
      console.info("[CRADESC] Connecté aux émulateurs Firebase locaux.");
    } catch (e) { console.warn("Émulateurs non disponibles :", e); }
  }
  return { app, auth, db, functions, demo: false };
}

/* Accès au SDK déjà chargé (pour data.js / auth.js). */
export function sdk() { return _sdk; }
export function getDb() { return db; }
export function getAuth() { return auth; }
export function getFunctions() { return functions; }
