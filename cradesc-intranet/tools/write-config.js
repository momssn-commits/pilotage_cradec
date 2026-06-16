/* Réécrit hosting/app/config.js avec la vraie configuration Firebase,
   en conservant les réglages d'authentification (méthode, super-admin, domaines).
   Usage : node tools/write-config.js <sdkconfig.json> <chemin config.js> */
const fs = require("fs");

const [, , sdkPath, outPath] = process.argv;
const raw = JSON.parse(fs.readFileSync(sdkPath, "utf8"));
// `firebase apps:sdkconfig --json` renvoie { result: { sdkConfig: {...} } } ou { sdkConfig } selon version.
const c = raw?.result?.sdkConfig || raw?.sdkConfig || raw?.result || raw;
const need = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
for (const k of need) if (!c[k]) { console.error("Champ manquant dans la config SDK :", k); process.exit(1); }

const src = fs.readFileSync(outPath, "utf8");
const block = `export const firebaseConfig = {
  apiKey: ${JSON.stringify(c.apiKey)},
  authDomain: ${JSON.stringify(c.authDomain)},
  projectId: ${JSON.stringify(c.projectId)},
  storageBucket: ${JSON.stringify(c.storageBucket)},
  messagingSenderId: ${JSON.stringify(c.messagingSenderId)},
  appId: ${JSON.stringify(c.appId)},
};`;
const out = src.replace(/export const firebaseConfig = \{[\s\S]*?\};/, block);
if (out === src) { console.error("Bloc firebaseConfig introuvable dans config.js"); process.exit(1); }
fs.writeFileSync(outPath, out);
console.log("config.js mis à jour pour le projet", c.projectId);
