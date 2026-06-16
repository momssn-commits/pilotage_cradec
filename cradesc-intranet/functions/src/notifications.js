/* Relances, rappels et aperçus via Gmail / Calendar / Drive.
   - Aperçus (accueil)  : lecture, avec le jeton OAuth de l'utilisateur connecté.
   - Envois / rappels   : au nom de l'organisation, via un compte de service à
                          délégation domaine (scopes gmail.send / calendar.events).
   Voir docs/01_setup_firebase.md (section "Compte de service & délégation").
   Les secrets sont fournis par firebase functions:secrets:set (jamais en clair). */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { audit } = require('./_audit');
// const { google } = require('googleapis'); // activer après configuration des secrets

/* Aperçus Google pour la page d'accueil (Gmail + Agenda + Drive, lecture).
   Le front (app/google.js) appelle cette fonction sous le nom 'notifications-apercus'.
   En production : utiliser le jeton OAuth de l'utilisateur (scopes *.readonly) pour
   interroger les API ; renvoyer une forme compacte prête à afficher.
   Tant que l'intégration OAuth n'est pas branchée, on renvoie une charge vide :
   le front retombe alors proprement sur ses aperçus de démonstration. */
exports.apercus = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
  // TODO : interroger Gmail/Calendar/Drive avec le jeton de l'utilisateur.
  //   const oauth = new google.auth.OAuth2(); oauth.setCredentials({ access_token: req.data.googleAccessToken });
  //   const gmail = google.gmail({ version: 'v1', auth: oauth }); ...
  return { mails: [], events: [], files: [] };
});

/* Envoi du bon de commande au fournisseur (Gmail API, au nom de l'organisation). */
exports.envoyerBonCommande = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const { bcId } = req.data;
  // TODO : charger le BC, garantir le PDF (pdf.genererBonCommande), envoyer via Gmail API.
  await audit({ acteur: req.auth.uid, action: 'notif.envoyerBonCommande', cible: `bonsCommande/${bcId}` });
  return { ok: true, bcId };
});

/* Rappels quotidiens d'échéance (tâches, décisions, paiements en attente). */
exports.rappelsQuotidiens = onSchedule('every day 07:00', async () => {
  const db = admin.firestore();
  // Exemple de relevé des échéances à relancer (envoi Gmail/Calendar à brancher).
  const now = new Date();
  const dans3j = new Date(now.getTime() + 3 * 864e5).toISOString().slice(0, 10);
  const [taches, decisions, dp] = await Promise.all([
    db.collection('taches').where('echeance', '<=', dans3j).where('statut', '!=', 'terminee').get().catch(() => ({ size: 0 })),
    db.collection('decisions').where('statut', '==', 'en_cours').get().catch(() => ({ size: 0 })),
    db.collection('demandesPaiement').where('statut', '==', 'en_attente').get().catch(() => ({ size: 0 })),
  ]);
  console.info(`[rappels] tâches=${taches.size} décisions=${decisions.size} paiements=${dp.size}`);
  // TODO : composer et envoyer le récapitulatif (Gmail) + créer les rappels (Calendar).
});
