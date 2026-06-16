/* Disponibilité budgétaire consolidée, sans double comptage.
   Recalcule l'engagé d'un programme à partir des bons de commande et des
   demandes de paiement, puis écrit /engagements/{progId}. Déclenché à chaque
   écriture pertinente (achats, paiements, avances).

   Règle anti-double-comptage (Dossier §2.2 / §9) :
     engagé = Σ bons de commande (hors annulés)
            + Σ demandes de paiement approuvées/ordonnancées/décaissées
              QUI NE PROVIENNENT PAS d'une mission (source !== 'mission').
   Les avances de mission deviennent des demandes de paiement (source='mission')
   via missions.avanceVersPaiement : on ne les compte donc qu'une seule fois,
   au titre du paiement, jamais en plus au titre de l'avance. */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

const COMPTE_PAIE = ['approuvee', 'ordonnancee', 'decaissee'];

async function recompute(progId) {
  if (!progId) return;
  const db = admin.firestore();
  const [bc, dp, prog] = await Promise.all([
    db.collection('bonsCommande').where('progId', '==', progId).get(),
    db.collection('demandesPaiement').where('progId', '==', progId).get(),
    db.collection('programmes').doc(progId).get(),
  ]);

  const engageAchats = bc.docs
    .filter(d => d.data().statut !== 'annule')
    .reduce((s, d) => s + (d.data().montant || 0), 0);

  const engagePaie = dp.docs
    .filter(d => d.data().source !== 'mission')          // évite le double comptage
    .filter(d => COMPTE_PAIE.includes(d.data().statut))
    .reduce((s, d) => s + (d.data().montant || 0), 0);

  const engage = engageAchats + engagePaie;
  const budgetTotal = prog.exists ? (prog.data().budgetTotal || 0) : 0;
  const disponible = budgetTotal ? budgetTotal - engage : null;

  await db.collection('engagements').doc(progId).set({
    progId, engage, engageAchats, engagePaie,
    budgetTotal, disponible,
    recalculeLe: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

exports.recompute = recompute;

exports.onAchatWrite = onDocumentWritten('bonsCommande/{id}', e =>
  recompute(e.data.after.data()?.progId || e.data.before.data()?.progId));
exports.onPaieWrite = onDocumentWritten('demandesPaiement/{id}', e =>
  recompute(e.data.after.data()?.progId || e.data.before.data()?.progId));
exports.onAvanceWrite = onDocumentWritten('avances/{id}', e =>
  recompute(e.data.after.data()?.progId || e.data.before.data()?.progId));
