self.Piskel = {
  version: 0.152,
  cache: true
}
self.addEventListener("activate",event => {
  event.waitUntil(caches.keys().then(versions => Promise.all(versions.map(cache => {
    if (cache !== Piskel.version) return caches.delete(cache);
  }))));
  event.waitUntil(clients.claim());
});
self.addEventListener("fetch",event => {
  event.respondWith(caches.match(event.request).then(response => {
    return response || fetch(event.request).then(async response => {
      if (Piskel.cache) caches.open(Piskel.version).then(cache => cache.put(event.request,response));
      return response.clone();
    });
  }));
});