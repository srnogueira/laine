// Caches the files for installation
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open("laine-store.08.12.21")
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
          "./scripts/coolprop/coolprop.js",
          "./scripts/coolprop/coolprop.wasm",
          "./scripts/coolprop/LICENSE",
        ])
      )
  );
});

// Delete old cache
self.addEventListener("activate", (event) => {
  var cacheKeeplist = ["laine-store.08.12.21"];
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
