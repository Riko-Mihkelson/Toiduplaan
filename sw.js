// Teenustöötaja: hoiab äpi ja fotod telefoni mälus, et äpp töötaks ka ilma internetita.
// Kui muudad äppi, suurenda VERSION numbrit – siis laaditakse uued failid.
const VERSION = "toiduplaan-v4";
const FILES = ["./", "./toiduplaan.html", "./manifest.json",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png",
  ...Array.from({ length: 69 }, (_, i) => `./img/d${i}.jpg`)];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Äpi fail: proovi enne internetist (et saada uusim versioon), muidu võta mälust.
// Fotod ja fondid: võta mälust, puudumisel laadi internetist ja jäta meelde.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" || req.url.endsWith(".html");
  if (isPage) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./toiduplaan.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
