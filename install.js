// Caches the files for installation
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open("laine-store.20.10.25.2")
      .then((cache) =>
        cache.addAll([
          "./",
          "./index.html",
          "./img/laine.png",
          "./styles/style.css",
          "./styles/codemirror.css",
          "./scripts/functions.js",
          "./scripts/laine.js",
          "./scripts/plots.js",
          "./scripts/ui.js",
          "./scripts/editor.js",
          "./scripts/laine_wasm/laine.js",
          "./scripts/laine_wasm/laine.wasm",
          "./scripts/laine_wasm/CoolProp_LICENSE",
        ])
      )
  );
});

// Delete old cache
self.addEventListener("activate", (event) => {
  var cacheKeeplist = ["laine-store.20.10.25.2"];
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (cacheKeeplist.indexOf(key) === -1) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch from cache then network
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
