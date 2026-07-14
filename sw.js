// Service Worker — Brueckheimer 2026
// Estratégia "network-first": sempre busca a versão mais nova quando há internet,
// e só usa a cópia salva (cache) se o aparelho estiver offline.
// Isso significa: quando você atualizar o familytrip2026.html no servidor,
// todo mundo vê a versão nova automaticamente na próxima vez que abrir o app —
// ninguém precisa reinstalar nada.

const CACHE_NAME = "brueckheimer-2026-v12";
const CORE_ASSETS = [
  "./familytrip2026.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
