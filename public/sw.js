/*
 * Service worker mínimo do PWA: não guarda páginas em cache (a agenda é em
 * tempo real), só garante uma tela "sem conexão" para navegações que falham e
 * mantém os ícones disponíveis. Isso basta para o Chrome oferecer a instalação
 * em qualquer versão. Troque CACHE ao mudar os arquivos pré-cacheados.
 */
const CACHE = "minhaagenda-v1"
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  /* navegação: rede; sem rede, a página offline */
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")))
    return
  }

  /* ícones: cache primeiro */
  const url = new URL(request.url)
  if (url.origin === self.location.origin && url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)))
  }
})
