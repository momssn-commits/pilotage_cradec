/* ============================================================
   CRADESC — Amorçage des référentiels (agents, programmes, projets)
   À lancer AVANT le front (sans rôle posé, les règles bloquent tout).

   Émulateur local :
     export FIRESTORE_EMULATOR_HOST=localhost:8080
     export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
     node seed.js

   Projet réel (compte de service) :
     export GOOGLE_APPLICATION_CREDENTIALS=/chemin/cle-service.json
     node seed.js --project cradesc-intranet
   ============================================================ */
const admin = require('firebase-admin');

const projectId = (process.argv.find(a => a.startsWith('--project='))
  || '').split('=')[1] || process.env.GCLOUD_PROJECT || 'cradesc-intranet';

admin.initializeApp({ projectId });
const db = admin.firestore();

const AGENTS = [
  { id: 'ag1', email: 'a.ndiaye@cradesc.org', nom: 'Aïssatou Ndiaye', role: 'admin',         actif: true },
  { id: 'ag2', email: 'c.fall@cradesc.org',   nom: 'Cheikh Fall',     role: 'dir_prog',      actif: true },
  { id: 'ag6', email: 'n.mbaye@cradesc.org',  nom: 'Nogaye Mbaye',    role: 'collaborateur', actif: true },
  { id: 'ag8', email: 'f.diallo@cradesc.org', nom: 'Fatima Diallo',   role: 'directrice',    actif: true },
];
const PROGRAMMES = [
  { id: 'PRG-DESC', code: 'PRG-DESC', intitule: 'Droits ESC',                budgetTotal: 121000000, bailleur: 'Fondation OSF' },
  { id: 'PRG-GOUV', code: 'PRG-GOUV', intitule: 'Gouvernance & redevabilité', budgetTotal: 64000000,  bailleur: 'UE' },
  { id: 'PRG-RENF', code: 'PRG-RENF', intitule: 'Renforcement de capacités',  budgetTotal: 28000000,  bailleur: 'AFD' },
];
const PROJETS = [
  { id: 'prj1', programmeId: 'PRG-DESC', intitule: 'Étude expulsions forcées', responsableId: 'ag2', periode: '2026' },
  { id: 'prj2', programmeId: 'PRG-GOUV', intitule: 'Justice fiscale',          responsableId: 'ag2', periode: '2026' },
];

async function upsert(coll, rows) {
  const batch = db.batch();
  rows.forEach(r => batch.set(db.collection(coll).doc(r.id), r, { merge: true }));
  await batch.commit();
  console.log(`  ✓ ${coll} : ${rows.length} document(s)`);
}

(async () => {
  console.log(`Amorçage des référentiels (projet ${projectId})…`);
  await upsert('agents', AGENTS);
  await upsert('programmes', PROGRAMMES);
  await upsert('projets', PROJETS);

  // En émulateur Auth, pré-créer les comptes + custom claims pour tester le RBAC.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    for (const a of AGENTS) {
      try {
        const u = await admin.auth().getUserByEmail(a.email).catch(() => admin.auth().createUser({ uid: a.id, email: a.email, displayName: a.nom }));
        await admin.auth().setCustomUserClaims(u.uid, { role: a.role });
      } catch (e) { console.warn('  ! auth', a.email, e.message); }
    }
    console.log('  ✓ comptes Auth (émulateur) + custom claims posés');
  }
  console.log('Terminé.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
