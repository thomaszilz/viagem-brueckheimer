// Service Worker — Brueckheimer 2026
//
// Estratégia "stale-while-revalidate": entrega na hora a cópia salva e busca a versão nova por
// trás, pra valer na próxima abertura.
//
// Antes era "network-first", que numa rede boa é ótimo mas em viagem é o pior caso: com uma barra
// de sinal numa rua de Santiago, o app ficava ESPERANDO a rede dar timeout antes de usar a cópia
// que já estava no aparelho. Ou seja, justamente onde o app mais precisa abrir rápido — na rua,
// no exterior, com roaming ruim — ele demorava mais.
//
// A troca tem um custo, e é consciente: uma versão nova publicada só aparece na segunda vez que a
// pessoa abre o app. Por isso o CACHE_NAME é versionado — subir o número invalida a cópia salva e
// força a busca imediata, que é como as atualizações continuam chegando no mesmo dia.

// Mescla o Service Worker do OneSignal (notificações push) neste mesmo arquivo, em vez de usar um
// arquivo separado — assim continuamos com um só Service Worker cuidando de tudo (cache + push).
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "brueckheimer-2026-v37";
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
    caches.match(event.request).then((salvo) => {
      const daRede = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => salvo);           // sem internet: fica o que já estava salvo
      return salvo || daRede;          // com cópia salva, responde na hora e atualiza por trás
    })
  );
});
