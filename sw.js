// Service worker minimo: serve a rendere l'app installabile su Chrome/Android
// (senza un fetch handler l'evento beforeinstallprompt non viene mai emesso)
// e a mostrare qualcosa di sensato quando il telefono e' offline.

const CACHE = "lista-camper-v2";   // <-- alza il numero quando cambi i file
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./apple-touch-icon.png",
  "./favicon.ico"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(nomi => Promise.all(
        nomi.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const richiesta = event.request;

  // Non intercettare mai il Web App di Apps Script: l'autenticazione Google
  // deve passare dalla rete, e una risposta dalla cache la romperebbe.
  if (!richiesta.url.startsWith(self.registration.scope)) {
    return;
  }
  if (richiesta.method !== "GET") {
    return;
  }

  // config.json non va MAI messo in cache: e' il file che porta l'URL aggiornato
  // del deployment Apps Script. Lasciato passare direttamente alla rete.
  if (new URL(richiesta.url).pathname.endsWith("/config.json")) {
    return;
  }

  // Rete prima, cache come rete di sicurezza: cosi' un aggiornamento del
  // launcher su GitHub Pages arriva subito, senza restare bloccato in cache.
  event.respondWith(
    fetch(richiesta)
      .then(risposta => {
        const copia = risposta.clone();
        caches.open(CACHE).then(cache => cache.put(richiesta, copia));
        return risposta;
      })
      .catch(() => caches.match(richiesta).then(
        hit => hit || caches.match("./index.html")
      ))
  );
});
