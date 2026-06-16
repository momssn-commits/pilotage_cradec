/* ============================================================
   CRADESC — Point d'entrée des fonctions serveur
   Chaque module exporte une ou plusieurs fonctions. Voir le
   Dossier technique développeur (§6) pour les signatures détaillées.
   ============================================================ */
const admin = require('firebase-admin');
admin.initializeApp();

exports.roles        = require('./src/roles');
exports.budget       = require('./src/budget');
exports.achats       = require('./src/achats');
exports.paiements    = require('./src/paiements');
exports.missions     = require('./src/missions');
exports.notifications = require('./src/notifications');
exports.pdf          = require('./src/pdf');
