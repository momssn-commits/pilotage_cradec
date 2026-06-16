/* Attribution des rôles via custom claims.
   En production, l'idéal est de dériver le rôle des groupes Google Workspace.
   Ici : table agents → rôle, posée à la première connexion + fonction admin. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { beforeUserCreated } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');

// À la création du compte : refuse hors domaine, pose le rôle depuis /agents.
exports.onCreate = beforeUserCreated(async (event) => {
  const email = event.data.email || '';
  if (!email.endsWith('@cradesc.org')) {
    throw new HttpsError('permission-denied', 'Domaine non autorisé.');
  }
  const snap = await admin.firestore().collection('agents')
    .where('email', '==', email).limit(1).get();
  const role = snap.empty ? 'collaborateur' : snap.docs[0].data().role;
  return { customClaims: { role } };
});

// Réservée à l'admin : (ré)affecter un rôle.
exports.setRole = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Réservé à l\'administratrice.');
  }
  const { uid, role } = req.data;
  const ALLOWED = ['admin', 'directrice', 'dir_prog', 'chef_projet', 'collaborateur'];
  if (!ALLOWED.includes(role)) throw new HttpsError('invalid-argument', 'Rôle inconnu.');
  await admin.auth().setCustomUserClaims(uid, { role });
  return { ok: true };
});
