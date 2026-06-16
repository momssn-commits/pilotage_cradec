/* CRADESC — Service worker (PWA)
   Cache applicatif léger : coquille + styles. Les données restent en ligne
   (Firestore gère le mode hors-ligne nativement côté SDK). */
const CACHE = "cradesc-shell-v2";
const ASSETS = [
  "./", "./index.html", "./styles/shell.css",
  "./app/shell.js", "./app/ui.js", "./app/rbac.js", "./app/config.js",
  "./app/firebase.js", "./app/auth.js", "./app/data.js", "./app/google.js",
  "./app/bus.js", "./assets/logo.js", "./manifest.webmanifest",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (le code applicatif reste à jour), avec repli sur le cache
// hors-ligne. On n'intercepte jamais Firebase/Google (autres origines).
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
  );
});
