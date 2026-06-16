/* ============================================================
   CRADESC — Rôles et contrôle d'accès (RBAC)
   La matrice ci-dessous reflète le Dossier technique §4.1.
   Elle est appliquée EN FAÇADE (tuiles + navigation). La règle qui
   FAIT FOI est côté serveur : firestore.rules + custom claims.
   ============================================================ */
import { IC } from "./ui.js";

export const ROLES = ["admin", "directrice", "dir_prog", "chef_projet", "collaborateur"];

/* Annexe A — libellés des rôles. */
export const ROLE_LABEL = {
  admin: "Administratrice",
  directrice: "Directrice",
  dir_prog: "Directeur de programme",
  chef_projet: "Chef de projet",
  collaborateur: "Agent",
};

const TOUS = ROLES;

/* Catalogue des plateformes (lanceur + accueil). `kind` : platform | workflow | lien.
   `roles` = matrice d'accès §4.1. */
export const APPS = [
  { id: "pilotage",  name: "Plateforme de Pilotage",     desc: "Programmes, projets, activités, tâches, budget et revue.", ic: IC.chart,  col: "#4A2E25", roles: TOUS, kind: "platform", meta: "Pilotage & revue" },
  { id: "tdr",       name: "Validation des TdR",          desc: "Termes de référence — rédaction et circuit de validation.", ic: IC.doc,    col: "#5E5A74", roles: TOUS, kind: "platform", meta: "Circuit de validation" },
  { id: "achats",    name: "Achats",                      desc: "Réquisitions et demandes d'achat tracées de bout en bout.", ic: IC.cart,   col: "#7C5CBF", roles: TOUS, kind: "workflow", meta: "Workflow" },
  { id: "paiements", name: "Demandes de paiement",        desc: "Engagement, ordonnancement et suivi des décaissements.",    ic: IC.wallet, col: "#C0395F", roles: ["admin", "directrice", "dir_prog", "chef_projet"], kind: "workflow", meta: "Workflow" },
  { id: "missions",  name: "Ordres de mission",           desc: "Préparation et validation des missions terrain.",          ic: IC.plane,  col: "#3a8fb7", roles: TOUS, kind: "workflow", meta: "Workflow" },
  { id: "direction", name: "Tableau de bord direction",   desc: "Vue consolidée du portefeuille et des indicateurs.",        ic: IC.chart,  col: "#3A241D", roles: ["admin", "directrice"], kind: "platform", meta: "Consolidé" },
  { id: "site",      name: "Site CRADESC",                desc: "Consulter le site public du CRADESC.",                      ic: IC.link,   col: "#4A2E25", roles: TOUS, kind: "lien", meta: "cradesc.org", url: "https://cradesc.org/" },
];

export const GOOGLE_APPS = [
  { id: "gmail",  name: "Gmail",          url: "https://mail.google.com",     col: "#EA4335" },
  { id: "agenda", name: "Google Agenda",  url: "https://calendar.google.com", col: "#4285F4" },
  { id: "drive",  name: "Google Drive",   url: "https://drive.google.com",    col: "#1FA463" },
];

/* Plateformes embarquées (chargées en iframe depuis platforms/<id>.html). */
export const EMBEDDED = {
  pilotage:  { label: "Plateforme de Pilotage",   col: "#4A2E25", src: "platforms/pilotage.html" },
  tdr:       { label: "Validation des TdR",        col: "#5E5A74", src: "platforms/tdr.html" },
  achats:    { label: "Achats",                    col: "#7C5CBF", src: "platforms/achats.html" },
  paiements: { label: "Demandes de paiement",      col: "#C0395F", src: "platforms/paiements.html" },
  missions:  { label: "Ordres de mission",         col: "#3a8fb7", src: "platforms/missions.html" },
  direction: { label: "Tableau de bord direction", col: "#3A241D", src: "platforms/direction.html" },
};

/* Un agent accède-t-il à une plateforme, selon son rôle ? */
export function canAccess(app, role) {
  if (!role) return false;
  if (!app || !app.roles) return true;
  return app.roles.includes(role);
}
