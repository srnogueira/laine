self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('fox-store').then((cache) => cache.addAll([
	'./',
	'./index.html',
	'./img/laine.png',
	'./styles/style.css',
	'./styles/codemirror.css',
	'./scripts/functions.js',
	'./scripts/laine.js',
	'./scripts/editor.js',
	'./scripts/plots.js',
	'./scripts/ui.js',
	'./scripts/third-party/coolprop.js',
	'./scripts/third-party/coolprop.wasm'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
