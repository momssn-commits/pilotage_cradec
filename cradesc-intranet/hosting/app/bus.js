/* ============================================================
   CRADESC — Bus inter-applications (pont portail ↔ plateformes)
   Remplace le postMessage de la maquette par un pont alimenté par
   Firebase :
     • handshake  : plateforme → 'cradesc-ready'  ;  portail → 'cradesc-context'
       (session réelle issue de Firebase Auth + rôle, engagements consolidés).
     • passerelle : plateforme missions → 'cradesc-mission-avance' →
       en mode réel, écrit /avances (déclenche missions.avanceVersPaiement) ;
       puis transmet les avances à la plateforme paiements ('cradesc-bus').
     • navigation : plateforme → 'cradesc-open-app' → ouverture par le portail.
   ============================================================ */
import { DEMO } from "./config.js";
import { initFirebase, sdk } from "./firebase.js";
import { data, getEngagements } from "./data.js";
import { currentSession } from "./auth.js";

const TODAY = "2026-06-11";
let _getIframe = () => null;     // () → { win, app }
let _onOpenApp = () => {};
let _pendingFocus = null;
let _avances = [];               // file locale des avances (transmise à paiements)

export function initBus({ getIframe, onOpenApp }) {
  _getIframe = getIframe || _getIframe;
  _onOpenApp = onOpenApp || _onOpenApp;
  window.addEventListener("message", onMessage);
  hydrateAvances();
}

export function setPendingFocus(app, ref) { _pendingFocus = ref ? { app, ref } : null; }

function session() {
  const s = currentSession();
  return s ? { agentId: s.agentId || null, role: s.role, name: s.name } : null;
}

/* Pousse le contexte (session + engagements) vers une plateforme. */
export async function sendContext(targetWin, app) {
  const engagements = await getEngagements();
  const ctx = { type: "cradesc-context", app, session: session(), engagements, today: TODAY };
  if (_pendingFocus && _pendingFocus.app === app) { ctx.focus = _pendingFocus.ref; _pendingFocus = null; }
  try { targetWin.postMessage(ctx, "*"); } catch {}
  if (app === "paiements") {
    try { targetWin.postMessage({ type: "cradesc-bus", avances: _avances }, "*"); } catch {}
  }
}

async function onMessage(e) {
  const d = e.data; if (!d || !d.type) return;

  if (d.type === "cradesc-ready" && e.source) {
    sendContext(e.source, d.app);
  }

  if (d.type === "cradesc-open-app" && d.app) {
    _onOpenApp(d.app, d.ref);
  }

  if (d.type === "cradesc-mission-avance" && d.payload) {
    await registerAvance(d.payload);
  }
}

/* Passerelle avance → paiement. */
async function registerAvance(payload) {
  if (_avances.some(x => x.ref === payload.ref)) return;     // idempotence côté portail
  _avances.push(payload);
  persistAvancesLocal();

  if (!DEMO) {
    // Écriture dans /avances → déclenche la Cloud Function missions.avanceVersPaiement,
    // qui crée la demande de paiement (source='mission', déjà approuvée).
    try {
      await data.add("avances", {
        ordreMissionId: payload.omId || null,
        agentId: payload.agentId || null,
        progId: payload.progId || null,
        montant: payload.montant || 0,
        omRef: payload.ref,
      });
    } catch (e) { console.warn("Écriture avance échouée :", e?.message); }
  }

  // Retransmettre à la plateforme paiements si elle est ouverte.
  const cur = _getIframe();
  if (cur && cur.app === "paiements" && cur.win) {
    try { cur.win.postMessage({ type: "cradesc-bus", avances: _avances }, "*"); } catch {}
  }
}

/* Persistance locale des avances (continuité entre ouvertures de plateformes). */
const AV_KEY = "cradesc_bus_avances";
function persistAvancesLocal() { try { localStorage.setItem(AV_KEY, JSON.stringify(_avances)); } catch {} }
function hydrateAvances() { try { _avances = JSON.parse(localStorage.getItem(AV_KEY)) || []; } catch { _avances = []; } }
