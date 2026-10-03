/*
 * Service worker de l'application cuisine (portée /admin/).
 * Rôle : rendre l'application installable et afficher une page claire si le
 * Wi-Fi tombe. Il ne met JAMAIS en cache les commandes ni les API : l'écran
 * affiche toujours l'état réel du serveur.
 */
const CACHE = "lpb-cuisine-v1";
const OFFLINE_URL = "/admin/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/admin/icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Navigation hors ligne uniquement : tout le reste passe directement au réseau.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});
