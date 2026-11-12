// Piattino service worker: app shell subito in cache, modello e librerie alla prima scansione.
const VERSION = 'piattino-v27';
// il codice dell'app: app.js è un modulo ES che importa gli altri. Un file nuovo va aggiunto qui, altrimenti offline manca.
const CODE = ['app.js', 'config.js', 'targets.js', 'migrate.js', 'foods.js', 'launch.js'];
const SHELL = ['./', './index.html', ...CODE.map(f => './' + f), './icons/kit-frutta.js', './icons/kit-orto.js', './icons/kit-cucina.js', './icons/kit-dolci-bevande.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

// Modelli di riconoscimento e TensorFlow.js: cache a parte, che resta da una versione all'altra. Così un aggiornamento dell'app
// non fa riscaricare i modelli e la scansione continua a funzionare offline. Va cambiato il nome solo quando cambiano quei file.
const MODELS = 'piattino-models-v1';
const isModel = path => /\/(model|model-food|model-scan|vendor)\//.test(path);

self.addEventListener('install', event => {
  // cache: 'reload' salta la cache HTTP del browser: nella cache nuova entrano sempre i file appena pubblicati,
  // anche dove il server lascia tenere le copie per qualche minuto
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = (await caches.keys()).filter(k => k !== VERSION && k !== MODELS);
    // i modelli già scaricati con una versione precedente passano nella cache che resta, prima di cancellare quella vecchia
    const models = await caches.open(MODELS);
    for (const k of keys) {
      const old = await caches.open(k);
      for (const req of await old.keys()) {
        if (!isModel(new URL(req.url).pathname) || await models.match(req)) continue;
        const res = await old.match(req); if (res) await models.put(req, res);
      }
    }
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Pagine: prima la rete (così arrivano gli aggiornamenti), poi la cache se sei offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(async res => {
          if (!res.ok) throw new Error('bad');
          const copy = res.clone();
          const txt = await copy.clone().text();
          if (!txt.includes('<title>Piattino</title>')) throw new Error('shape');
          caches.open(VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Il codice dell'app segue la stessa regola delle pagine: rete prima, cache se offline.
  const path = new URL(req.url).pathname;
  if (CODE.some(f => path.endsWith('/' + f))) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          if (!res.ok) throw new Error('bad');
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Tutto il resto (modelli, librerie, icone): prima la cache. I modelli vanno nella cache che resta fra una versione e l'altra.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(isModel(path) ? MODELS : VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
