// Register service worker to control making site work offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./install.js')
    .then(() => { console.log('Service Worker Registered'); });
}
