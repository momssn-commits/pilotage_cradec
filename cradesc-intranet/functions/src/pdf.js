/* Génération documentaire (bons de commande, ordres de mission, attestations).
   Pistes : pdfkit/pdf-lib dans la fonction, ou Google Docs API + export PDF,
   puis dépôt du fichier dans le Drive partagé. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');

exports.genererBonCommande = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const { bcId } = req.data;
  // TODO : composer le PDF à partir du bon de commande, le déposer sur Drive,
  //        renvoyer le lien Drive.
  return { ok: true, bcId, driveUrl: null };
});
