/* ============================================================
   CRADESC — Authentification
   Mode réel  : Firebase Auth.
     • METHODE_AUTH="password" (défaut) : e-mail + mot de passe — fonctionne
       sans nom de domaine (compatible IP nue / serveur Traefik).
     • METHODE_AUTH="google" : Google Sign-In (à activer une fois un domaine
       HTTPS en place ; Google refuse l'OAuth sur une IP nue).
   Mode démo  : connexion directe en super-administrateur (aucun compte de test).
   Le rôle vient du custom claim ; le super-admin est forcé en 'admin'.
   Session uniforme : {uid, agentId, name, email, role, roleLabel, color}
   ============================================================ */
import { DEMO, METHODE_AUTH, SUPER_ADMIN_EMAIL, DOMAINES_AUTORISES } from "./config.js";
import { initFirebase, sdk } from "./firebase.js";
import { ROLE_LABEL } from "./rbac.js";

const COLORS = ["#4A2E25", "#9B3B2E", "#9A6B22", "#4E6B52", "#5E5A74", "#3a5a78"];
const colorFor = s => COLORS[[...String(s || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

let _session = null;
let _listeners = [];

export function currentSession() { return _session; }
export function onSession(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(x => x !== fn); }; }
function emit() { _listeners.forEach(fn => { try { fn(_session); } catch (e) { console.error(e); } }); }

function isSuperAdmin(email) { return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(); }
function domainOk(email) {
  if (!DOMAINES_AUTORISES.length) return true;            // aucune restriction
  return DOMAINES_AUTORISES.some(d => (email || "").endsWith("@" + d)) || isSuperAdmin(email);
}
function withLabel(u) { return { ...u, roleLabel: ROLE_LABEL[u.role] || u.role }; }

/* --- Démarrage : écoute l'état d'auth (réel) ou attend un login démo. --- */
export async function startAuth(onChange) {
  if (onChange) onSession(onChange);
  if (DEMO) { _session = null; emit(); return; }

  const { auth } = await initFirebase();
  const { onAuthStateChanged, getIdTokenResult } = sdk().auth;
  onAuthStateChanged(auth, async (user) => {
    if (!user) { _session = null; emit(); return; }
    if (!domainOk(user.email)) { await signOut(); _session = null; emit(); return; }
    const tok = await getIdTokenResult(user, true);
    const role = isSuperAdmin(user.email) ? "admin" : (tok.claims.role || "collaborateur");
    const agentId = await lookupAgentId(user.email);
    _session = withLabel({
      uid: user.uid, agentId, name: user.displayName || user.email,
      email: user.email, role, color: colorFor(user.email), photo: user.photoURL || null,
    });
    emit();
  });
}

async function lookupAgentId(email) {
  try {
    const { db } = await initFirebase();
    const { collection, query, where, limit, getDocs } = sdk().fs;
    const snap = await getDocs(query(collection(db, "agents"), where("email", "==", email), limit(1)));
    return snap.empty ? null : snap.docs[0].id;
  } catch (e) { return null; }
}

/* --- Connexion e-mail + mot de passe (fonctionne sans domaine) --- */
export async function signInWithPassword(email, password) {
  if (DEMO) throw new Error("DEMO");
  const { auth } = await initFirebase();
  const { signInWithEmailAndPassword } = sdk().auth;
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

/* --- Connexion Google (disponible une fois un domaine HTTPS configuré) --- */
export async function signInWithGoogle() {
  if (DEMO) throw new Error("DEMO");
  const { auth } = await initFirebase();
  const { GoogleAuthProvider, signInWithPopup } = sdk().auth;
  const provider = new GoogleAuthProvider();
  if (DOMAINES_AUTORISES.length) provider.setCustomParameters({ hd: DOMAINES_AUTORISES[0] });
  const cred = await signInWithPopup(auth, provider);
  if (!domainOk(cred.user.email)) { await signOut(); throw new Error("Compte non autorisé."); }
  return cred.user;
}

export const authMethod = METHODE_AUTH;

/* Connexion démo : super-administrateur, sans compte de test. */
export function loginDemo() {
  _session = withLabel({
    uid: "super_admin", agentId: "admin", name: SUPER_ADMIN_EMAIL.split("@")[0],
    email: SUPER_ADMIN_EMAIL, role: "admin", color: colorFor(SUPER_ADMIN_EMAIL),
  });
  emit();
  return _session;
}

export async function signOut() {
  if (DEMO) { _session = null; emit(); return; }
  const { auth } = await initFirebase();
  await sdk().auth.signOut(auth);
  _session = null; emit();
}
