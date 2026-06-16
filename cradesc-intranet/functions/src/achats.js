/* Transitions du circuit d'achat par seuils (validation → bon de commande).
   Le client ne modifie pas directement le statut : il appelle cette fonction,
   qui vérifie le droit, le seuil, puis écrit (réquisition + bon de commande),
   et consigne l'opération dans le journal d'audit. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { audit } = require('./_audit');

const SEUILS = { // FCFA — à ajuster selon la politique CRADESC
  chef_projet: 500000,
  dir_prog:   2000000,
  directrice: Infinity,
  admin:      Infinity,
};

exports.valider = onCall(async (req) => {
  const role = req.auth?.token.role;
  if (!role) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const db = admin.firestore();
  const ref = db.collection('requisitions').doc(req.data.requisitionId);

  const bcRef = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Réquisition introuvable.');
    const r = snap.data();
    if (r.statut === 'validee') throw new HttpsError('failed-precondition', 'Déjà validée.');
    if ((r.montant || 0) > (SEUILS[role] || 0)) {
      throw new HttpsError('permission-denied', 'Montant au-delà de votre seuil de validation.');
    }
    tx.update(ref, {
      statut: 'validee', valideePar: req.auth.uid,
      valideeLe: admin.firestore.FieldValue.serverTimestamp(),
    });
    const bc = db.collection('bonsCommande').doc();
    tx.set(bc, {
      requisitionId: ref.id, fournisseur: r.fournisseur, montant: r.montant,
      progId: r.progId, objet: r.objet || null, statut: 'emis',
      driveFileId: null, // renseigné par pdf.genererBonCommande
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return bc;
  });

  await audit({ acteur: req.auth.uid, action: 'achat.valider',
    cible: `requisitions/${ref.id}`, details: { bonCommande: bcRef.id } });
  return { ok: true, bcId: bcRef.id };
});
