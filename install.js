// Caches the files for installation
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open("laine-store")
      .then((cache) =>
        cache.addAll([
          "./",
          "./index.html",
          "./img/laine.png",
          "./styles/style.css",
          "./styles/codemirror.css",
          "./scripts/index.js",
          "./scripts/editor.js",
          "./scripts/third-party/coolprop.js",
          "./scripts/third-party/coolprop.wasm",
        ])
      )
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
