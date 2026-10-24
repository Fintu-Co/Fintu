/*
  Service worker de Fintú — lo justo para ser una app instalable y aguantar
  una mala señal, sin servir versiones viejas de la app:

  · Páginas: primero la red. Sin conexión → la última versión guardada, o un
    aviso de "sin conexión" si nunca se guardó.
  · /assets/* (archivos con hash en el nombre, nunca cambian): primero la caché.
  · El API (otro dominio) y todo lo demás pasan directo a la red: los datos
    de tus tarjetas nunca se guardan aquí.
*/
const VERSION = 'fintu-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png'];

const OFFLINE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · Fintú</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#E9E3DA;color:#2B1B17;
font-family:system-ui,sans-serif;text-align:center;padding:24px}h1{font-family:Georgia,serif;font-weight:400;font-size:30px;margin:0 0 8px}
p{color:#6B5148;margin:0 0 20px}button{min-height:46px;padding:0 22px;border:0;border-radius:999px;background:#2F4A3E;color:#F7F3ED;font:inherit;font-weight:600}</style>
</head><body><div><h1>Sin conexión</h1><p>Revisa tu internet y vuelve a intentar.</p>
<button onclick="location.reload()">Reintentar</button></div></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // API y fuentes: siempre red

  // Navegación (abrir la app o cambiar de pantalla)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('/', copy));
          return res;
        })
        .catch(async () => (await caches.match('/')) ||
          new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
    );
    return;
  }

  // Archivos de build con hash: no cambian nunca
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
