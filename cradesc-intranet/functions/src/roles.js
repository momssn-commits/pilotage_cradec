/* Attribution des rôles via custom claims.
   En production, l'idéal est de dériver le rôle des groupes Google Workspace.
   Ici : table agents → rôle, posée à la première connexion + fonction admin. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { beforeUserCreated } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');

// Super-administrateur (configurable). Pas de restriction de domaine ici :
// les comptes sont créés explicitement (amorçage / admin), pas en libre-service.
const SUPER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'momssn@gmail.com').toLowerCase();
// Liste blanche de domaines optionnelle (vide = aucune restriction).
const DOMAINES = (process.env.DOMAINES_AUTORISES || '').split(',').map(s => s.trim()).filter(Boolean);

// À la création du compte : pose le rôle (super-admin, /agents, sinon refus).
exports.onCreate = beforeUserCreated(async (event) => {
  const email = (event.data.email || '').toLowerCase();
  if (email === SUPER_ADMIN_EMAIL) return { customClaims: { role: 'admin' } };
  if (DOMAINES.length && !DOMAINES.some(d => email.endsWith('@' + d))) {
    throw new HttpsError('permission-denied', 'Domaine non autorisé.');
  }
  const snap = await admin.firestore().collection('agents')
    .where('email', '==', email).limit(1).get();
  if (snap.empty) throw new HttpsError('permission-denied', 'Compte non référencé. Contactez l\'administrateur.');
  return { customClaims: { role: snap.docs[0].data().role || 'collaborateur' } };
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
