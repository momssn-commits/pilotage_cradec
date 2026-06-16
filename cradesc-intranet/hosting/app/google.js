/* ============================================================
   CRADESC — Aperçus Google Workspace (accueil)
   Dossier technique §5 : aperçu Gmail + Agenda (lecture, jeton de
   l'utilisateur), documents Drive. En production, ces aperçus sont
   servis soit en appel direct (gmail.readonly / calendar.readonly),
   soit via une Cloud Function. Ici, on tente la Cloud Function
   `aperçus` et, à défaut, on retombe sur des données de démonstration.
   ============================================================ */
import { DEMO } from "./config.js";
import { initFirebase, sdk } from "./firebase.js";

const DEMO_MAILS = [
  { from: "Bailleur — Fondation OSF", subj: "Validation du rapport semestriel ESC", time: "09:12", unread: true,  col: "#9B3B2E" },
  { from: "Cheikh Fall",              subj: "Re: Grille de collecte — étude expulsions", time: "08:40", unread: true,  col: "#9A6B22" },
  { from: "Google Agenda",            subj: "Rappel : Conférence justice fiscale (18/06)", time: "Hier", unread: false, col: "#4285F4" },
  { from: "Fatou Diop",               subj: "Justificatifs mission Matam — relance", time: "Hier", unread: false, col: "#4E6B52" },
];
const DEMO_EVENTS = [
  { d: "11", m: "Juin", t: "Atelier de plaidoyer — réforme fiscale", s: "09:00 – 13:00 · Dakar", col: "#9A6B22" },
  { d: "12", m: "Juin", t: "Revue à mi-parcours du budget ESC", s: "10:00 · Siège CRADESC", col: "#4E6B52" },
  { d: "18", m: "Juin", t: "Conférence nationale justice fiscale", s: "Toute la journée · UCAD", col: "#9B3B2E" },
];
const DEMO_FILES = [
  { n: "Rapport semestriel ESC — v3.docx", s: "Modifié il y a 2 h · Aïssatou", ext: "DOC", col: "#3a5a78" },
  { n: "Budget consolidé 2026.xlsx",       s: "Modifié hier · Fatou", ext: "XLS", col: "#4E6B52" },
  { n: "TdR — Étude expulsions forcées.pdf", s: "Modifié hier · Cheikh", ext: "PDF", col: "#9B3B2E" },
  { n: "Présentation séminaire annuel.pptx", s: "Il y a 3 j · Khady", ext: "PPT", col: "#9A6B22" },
];

async function callApercus() {
  if (DEMO) return null;
  try {
    const { functions } = await initFirebase();
    const { httpsCallable } = sdk().fn;
    const res = await httpsCallable(functions, "notifications-apercus")({});
    return res.data || null;
  } catch (e) { console.warn("Aperçus Google indisponibles, repli démo :", e?.message); return null; }
}

export async function loadWorkspace() {
  const live = await callApercus();
  return {
    mails:  live?.mails  || DEMO_MAILS,
    events: live?.events || DEMO_EVENTS,
    files:  live?.files  || DEMO_FILES,
  };
}
