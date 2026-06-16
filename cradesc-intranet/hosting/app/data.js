/* ============================================================
   CRADESC — Couche de données
   Une seule API pour les deux modes :
     • Réel : Cloud Firestore (collections du Dossier technique §7).
     • Démo : persistance locale (localStorage), jeux de démonstration.
   Les plateformes embarquées conservent leur propre rendu ; cette couche
   alimente le portail (accueil, budget consolidé) et sert de socle à la
   migration plateforme → Firestore (Achats servant de gabarit).
   ============================================================ */
import { DEMO } from "./config.js";
import { initFirebase, sdk } from "./firebase.js";

/* ---- Référentiels de démarrage (alignés sur les identifiants de la maquette) ---- */
export const SEED = {
  agents: [
    { id: "ag1", email: "a.ndiaye@cradesc.org", nom: "Aïssatou Ndiaye", role: "admin",        actif: true },
    { id: "ag2", email: "c.fall@cradesc.org",   nom: "Cheikh Fall",     role: "dir_prog",     actif: true },
    { id: "ag6", email: "n.mbaye@cradesc.org",  nom: "Nogaye Mbaye",    role: "collaborateur", actif: true },
    { id: "ag8", email: "f.diallo@cradesc.org", nom: "Fatima Diallo",   role: "directrice",   actif: true },
  ],
  programmes: [
    { id: "PRG-DESC", code: "PRG-DESC", intitule: "Droits ESC",            budgetTotal: 121000000, bailleur: "Fondation OSF" },
    { id: "PRG-GOUV", code: "PRG-GOUV", intitule: "Gouvernance & redevabilité", budgetTotal: 64000000, bailleur: "UE" },
    { id: "PRG-RENF", code: "PRG-RENF", intitule: "Renforcement de capacités",  budgetTotal: 28000000, bailleur: "AFD" },
  ],
  projets: [
    { id: "prj1", programmeId: "PRG-DESC", intitule: "Étude expulsions forcées", responsableId: "ag2", periode: "2026" },
    { id: "prj2", programmeId: "PRG-GOUV", intitule: "Justice fiscale",          responsableId: "ag2", periode: "2026" },
  ],
};

/* Engagements consolidés de référence transmis aux plateformes (par domaine,
   pour éviter le double comptage côté plateforme — cf. shell de la maquette). */
export const ENG_BASE = {
  achats:    { "PRG-DESC": 1490000, "PRG-GOUV":  180000 },
  paiements: { "PRG-DESC": 1490000, "PRG-GOUV": 1380000 },
  missions:  { "PRG-DESC": 1575000, "PRG-GOUV": 1260000, "PRG-RENF": 680000 },
};

/* ====================== Implémentation DÉMO ====================== */
const LS_KEY = "cradesc_data_v1";
function lsLoad() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } }
function lsSave(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} }
function demoColl(name) { const d = lsLoad(); if (!d[name]) { d[name] = (SEED[name] || []).slice(); lsSave(d); } return d[name]; }

const demoApi = {
  async list(coll) { return demoColl(coll).slice(); },
  async get(coll, id) { return demoColl(coll).find(x => x.id === id) || null; },
  async add(coll, obj) {
    const d = lsLoad(); d[coll] = d[coll] || (SEED[coll] || []).slice();
    const id = obj.id || coll + "_" + Math.random().toString(36).slice(2, 9);
    const rec = { ...obj, id, createdAt: new Date().toISOString() };
    d[coll].push(rec); lsSave(d); return rec;
  },
  async set(coll, id, obj) {
    const d = lsLoad(); d[coll] = d[coll] || []; const i = d[coll].findIndex(x => x.id === id);
    const rec = { ...obj, id }; if (i < 0) d[coll].push(rec); else d[coll][i] = { ...d[coll][i], ...rec }; lsSave(d); return rec;
  },
  async update(coll, id, patch) { return this.set(coll, id, { ...(await this.get(coll, id)), ...patch }); },
  watch(coll, cb) { this.list(coll).then(cb); return () => {}; },
  async engagements() { return ENG_BASE; },
};

/* ====================== Implémentation RÉELLE (Firestore) ====================== */
const liveApi = {
  async _fs() { const { db } = await initFirebase(); return { db, ...sdk().fs }; },
  async list(coll) {
    const { db, collection, getDocs } = await this._fs();
    const snap = await getDocs(collection(db, coll));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async get(coll, id) {
    const { db, doc, getDoc } = await this._fs();
    const s = await getDoc(doc(db, coll, id)); return s.exists() ? { id: s.id, ...s.data() } : null;
  },
  async add(coll, obj) {
    const { db, collection, addDoc, serverTimestamp } = await this._fs();
    const ref = await addDoc(collection(db, coll), { ...obj, createdAt: serverTimestamp() });
    return { id: ref.id, ...obj };
  },
  async set(coll, id, obj) {
    const { db, doc, setDoc } = await this._fs();
    await setDoc(doc(db, coll, id), obj, { merge: true }); return { id, ...obj };
  },
  async update(coll, id, patch) {
    const { db, doc, updateDoc } = await this._fs();
    await updateDoc(doc(db, coll, id), patch); return { id, ...patch };
  },
  watch(coll, cb) {
    let unsub = () => {};
    this._fs().then(({ db, collection, onSnapshot }) => {
      unsub = onSnapshot(collection(db, coll), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    });
    return () => unsub();
  },
  /* Construit l'objet par domaine attendu par les plateformes à partir des
     collections sources (engagements consolidés côté serveur dans /engagements). */
  async engagements() {
    try {
      const [bons, paie, av] = await Promise.all([
        this.list("bonsCommande"), this.list("demandesPaiement"), this.list("avances"),
      ]);
      const acc = { achats: {}, paiements: {}, missions: {} };
      const add = (dom, pg, m) => { if (!pg) return; acc[dom][pg] = (acc[dom][pg] || 0) + (m || 0); };
      bons.forEach(b => add("achats", b.progId, b.montant));
      paie.filter(p => p.source !== "mission").forEach(p => add("paiements", p.progId, p.montant));
      av.forEach(a => add("missions", a.progId, a.montant));
      return acc;
    } catch (e) { return ENG_BASE; }
  },
};

export const data = DEMO ? demoApi : liveApi;
export async function getEngagements() { return data.engagements(); }
