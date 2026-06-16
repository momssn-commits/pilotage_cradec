/* Journal d'audit — ajout seulement (cf. Dossier technique §7.4 / §8).
   Toute validation et tout décaissement y sont consignés, horodatés. */
const admin = require('firebase-admin');

async function audit({ acteur, action, cible, details }) {
  try {
    await admin.firestore().collection('audit').add({
      acteur: acteur || null,
      action,
      cible: cible || null,
      details: details || null,
      horodatage: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[audit] échec écriture :', e);
  }
}

module.exports = { audit };
