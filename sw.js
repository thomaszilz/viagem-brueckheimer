// Service Worker — Brueckheimer 2026
// Estratégia "network-first": sempre busca a versão mais nova quando há internet,
// e só usa a cópia salva (cache) se o aparelho estiver offline.
// Isso significa: quando você atualizar o familytrip2026.html no servidor,
// todo mundo vê a versão nova automaticamente na próxima vez que abrir o app —
// ninguém precisa reinstalar nada.

// Mescla o Service Worker do OneSignal (notificações push) neste mesmo arquivo, em vez de usar um
// arquivo separado — assim continuamos com um só Service Worker cuidando de tudo (cache + push).
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "brueckheimer-2026-v27";
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
  // Só cuida dos arquivos do próprio site (HTML, manifest). Fotos e mapas de fora (postimg.cc,
  // Wikipédia, OpenStreetMap etc.) passam direto pro navegador — o Safari em modo "instalado"
  // (adicionado à tela de início) trava esse tipo de imagem externa quando o Service Worker
  // tenta interceptar e cachear, por isso elas sumiam só depois de instalar o app.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
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
