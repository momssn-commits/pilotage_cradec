/* Ordonnancement et décaissement d'une demande de paiement.
   Réservé à la direction. Vérifie la disponibilité budgétaire (depuis
   /engagements/{progId}, écrit par budget.js) avant de décaisser, en
   transaction, et consigne l'opération dans le journal d'audit. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { audit } = require('./_audit');

exports.decaisser = onCall(async (req) => {
  const role = req.auth?.token.role;
  if (!['admin', 'directrice'].includes(role)) {
    throw new HttpsError('permission-denied', 'Réservé à la direction.');
  }
  const db = admin.firestore();
  const ref = db.collection('demandesPaiement').doc(req.data.dpId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Demande introuvable.');
    const dp = snap.data();
    if (dp.statut === 'decaissee') throw new HttpsError('failed-precondition', 'Déjà décaissée.');

    // Contrôle de disponibilité budgétaire.
    if (dp.progId) {
      const eng = await tx.get(db.collection('engagements').doc(dp.progId));
      const dispo = eng.exists ? eng.data().disponible : null;
      if (dispo != null && (dp.montant || 0) > dispo) {
        throw new HttpsError('failed-precondition',
          `Disponibilité insuffisante (${dispo} FCFA) pour ce décaissement.`);
      }
    }
    tx.update(ref, {
      statut: 'decaissee', decaisseePar: req.auth.uid,
      decaisseeLe: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await audit({ acteur: req.auth.uid, action: 'paiement.decaisser', cible: `demandesPaiement/${ref.id}` });
  return { ok: true };
});
