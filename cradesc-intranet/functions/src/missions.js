/* Passerelle : une avance d'ordre de mission crée automatiquement une
   demande de paiement déjà validée (source = 'mission'), sans ressaisie.
   C'est le maillon "avance → paiement" de la maquette, rendu réel et atomique.
   Idempotent : ne crée jamais deux demandes pour la même avance. */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { audit } = require('./_audit');

exports.avanceVersPaiement = onDocumentCreated('avances/{id}', async (event) => {
  const av = event.data.data();
  const db = admin.firestore();

  // Idempotence : ne pas recréer si une DP référence déjà cette avance.
  const existing = await db.collection('demandesPaiement')
    .where('avanceId', '==', event.params.id).limit(1).get();
  if (!existing.empty) return;

  const dp = await db.collection('demandesPaiement').add({
    type: 'avance_mission',
    source: 'mission',
    avanceId: event.params.id,
    omRef: av.omRef || null,
    beneficiaire: av.agentId || null,
    montant: av.montant || 0,
    progId: av.progId || null,
    statut: 'approuvee',          // déjà validée par le circuit mission
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await audit({ acteur: 'system', action: 'mission.avanceVersPaiement',
    cible: `avances/${event.params.id}`, details: { demandePaiement: dp.id, montant: av.montant } });
});
