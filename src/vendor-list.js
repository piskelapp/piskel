// Vendored libraries, in load order. They run as classic code, before the
// application bundle: gif.js for instance needs a top-level `this === window`.
exports.vendors = [
  "js/lib/jquery-1.8.0.js",
  "js/lib/jquery-ui-1.10.3.custom.js",
  "js/lib/pubsub.js",
  "js/lib/bootstrap/bootstrap.js",
  "js/lib/gif/gif.worker.js",
  "js/lib/gif/gif.js",
  "js/lib/gif/libgif.js",
  "js/lib/jszip/jszip.min.js",
  "js/lib/spectrum/spectrum.js"
];
