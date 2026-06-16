/* ============================================================
   CRADESC — Authentification
   Mode réel  : Google Sign-In (OAuth/OIDC) via Firebase Auth,
                restreint au domaine, rôle lu dans le custom claim.
   Mode démo  : sélecteur de compte simulé (cf. maquette de référence).
   Expose une session uniforme : {uid, agentId, name, email, role, roleLabel, color}
   ============================================================ */
import { DEMO, DOMAINE_AUTORISE } from "./config.js";
import { initFirebase, sdk } from "./firebase.js";
import { ROLE_LABEL } from "./rbac.js";

/* Comptes de démonstration (reprend les profils de la maquette). */
export const DEMO_USERS = [
  { uid: "u_nogaye", agentId: "ag6", name: "Nogaye Mbaye",     email: "n.mbaye@cradesc.org",  role: "collaborateur", color: "#5E5A74" },
  { uid: "u_aissa",  agentId: "ag1", name: "Aïssatou Ndiaye",  email: "a.ndiaye@cradesc.org", role: "admin",         color: "#4A2E25" },
  { uid: "u_fatima", agentId: "ag8", name: "Fatima Diallo",    email: "f.diallo@cradesc.org", role: "directrice",    color: "#9B3B2E" },
  { uid: "u_cheikh", agentId: "ag2", name: "Cheikh Fall",      email: "c.fall@cradesc.org",   role: "dir_prog",      color: "#9A6B22" },
];

const COLORS = ["#4A2E25", "#9B3B2E", "#9A6B22", "#4E6B52", "#5E5A74", "#3a5a78"];
const colorFor = s => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

let _session = null;
let _listeners = [];

export function currentSession() { return _session; }
export function onSession(fn) { _listeners.push(fn); if (_session !== undefined) fn(_session); return () => { _listeners = _listeners.filter(x => x !== fn); }; }
function emit() { _listeners.forEach(fn => { try { fn(_session); } catch (e) { console.error(e); } }); }

function withLabel(u) { return { ...u, roleLabel: ROLE_LABEL[u.role] || u.role }; }

/* --- Démarrage : écoute l'état d'auth (réel) ou attend un login démo. --- */
export async function startAuth(onChange) {
  if (onChange) onSession(onChange);
  if (DEMO) { _session = null; emit(); return; }

  const { auth } = await initFirebase();
  const { onAuthStateChanged, getIdTokenResult } = sdk().auth;
  onAuthStateChanged(auth, async (user) => {
    if (!user) { _session = null; emit(); return; }
    if (!user.email || !user.email.endsWith("@" + DOMAINE_AUTORISE)) {
      await signOut(); _session = null; emit(); return;
    }
    const tok = await getIdTokenResult(user, true);
    const role = tok.claims.role || "collaborateur";
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
    const q = query(collection(db, "agents"), where("email", "==", email), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].id;
  } catch (e) { return null; }
}

/* --- Connexion --- */
export async function signInWithGoogle() {
  if (DEMO) throw new Error("DEMO");
  const { auth } = await initFirebase();
  const { GoogleAuthProvider, signInWithPopup } = sdk().auth;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: DOMAINE_AUTORISE });   // n'affiche que le domaine pro
  provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
  provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
  const cred = await signInWithPopup(auth, provider);
  if (!cred.user.email.endsWith("@" + DOMAINE_AUTORISE)) {
    await signOut();
    throw new Error("Domaine non autorisé : utilisez votre compte @" + DOMAINE_AUTORISE);
  }
  return cred.user;
}

/* Connexion démo : choisit un des comptes simulés. */
export function loginDemo(uid) {
  const u = DEMO_USERS.find(x => x.uid === uid) || DEMO_USERS[0];
  _session = withLabel(u);
  emit();
  return _session;
}

export async function signOut() {
  if (DEMO) { _session = null; emit(); return; }
  const { auth } = await initFirebase();
  await sdk().auth.signOut(auth);
  _session = null; emit();
}
