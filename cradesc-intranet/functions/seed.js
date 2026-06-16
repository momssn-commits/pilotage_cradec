/* ============================================================
   CRADESC — Amorçage : super-administrateur (aucune donnée de test)
   Crée le compte momssn@gmail.com (e-mail + mot de passe), lui pose le
   custom claim role=admin, et écrit sa fiche agent. À lancer AVANT le front
   (sans rôle posé, les règles bloquent tout).

   Émulateur local :
     export FIRESTORE_EMULATOR_HOST=localhost:8080
     export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
     ADMIN_PASSWORD='choisir-un-mot-de-passe' node seed.js

   Projet réel (compte de service) :
     export GOOGLE_APPLICATION_CREDENTIALS=/chemin/cle-service.json
     ADMIN_PASSWORD='mot-de-passe-fort' node seed.js --project=cradesc-intranet
   ============================================================ */
const admin = require('firebase-admin');

const projectId = (process.argv.find(a => a.startsWith('--project='))
  || '').split('=')[1] || process.env.GCLOUD_PROJECT || 'cradesc-intranet';
const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'momssn@gmail.com';
const SUPER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

admin.initializeApp({ projectId });
const db = admin.firestore();

(async () => {
  console.log(`Amorçage du super-administrateur (projet ${projectId})…`);
  if (!SUPER_ADMIN_PASSWORD) {
    console.error('  ✗ ADMIN_PASSWORD manquant. Exemple :');
    console.error("     ADMIN_PASSWORD='mot-de-passe-fort' node seed.js --project=cradesc-intranet");
    process.exit(1);
  }

  // 1) Compte Auth (créé ou mis à jour).
  let user;
  try {
    user = await admin.auth().getUserByEmail(SUPER_ADMIN_EMAIL);
    await admin.auth().updateUser(user.uid, { password: SUPER_ADMIN_PASSWORD, disabled: false });
    console.log('  ✓ compte existant mis à jour');
  } catch {
    user = await admin.auth().createUser({
      email: SUPER_ADMIN_EMAIL, password: SUPER_ADMIN_PASSWORD,
      emailVerified: true, displayName: SUPER_ADMIN_EMAIL.split('@')[0],
    });
    console.log('  ✓ compte créé');
  }

  // 2) Custom claim role=admin (super-administrateur).
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
  console.log('  ✓ rôle admin posé (custom claim)');

  // 3) Fiche agent (référentiel).
  await db.collection('agents').doc('admin').set({
    email: SUPER_ADMIN_EMAIL, nom: SUPER_ADMIN_EMAIL.split('@')[0],
    role: 'admin', actif: true, uid: user.uid,
  }, { merge: true });
  console.log('  ✓ fiche agent écrite');

  console.log(`Terminé. Connectez-vous avec ${SUPER_ADMIN_EMAIL} (mot de passe fourni).`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
