(function () {
  /**
   * This file is inlined into index.html via @@include('piskel-boot.js').
   * During build, the html-include vite plugin replaces @@version with
   * the build timestamp (e.g. '-2026-04-05-12-19').
   */
  var version = "@@version";

  if (!window.piskelReadyCallbacks) {
    window.piskelReadyCallbacks = [];
  }

  window._onPiskelReady = function () {
    var loadingMask = document.getElementById("loading-mask");
    loadingMask.style.opacity = 0;
    window.setTimeout(function () {
      loadingMask.parentNode.removeChild(loadingMask);
    }, 600);
    pskl.app.init();
    pskl._releaseVersion = "@@releaseVersion";

    for (var i = 0; i < window.piskelReadyCallbacks.length; i++) {
      window.piskelReadyCallbacks[i]();
    }
  };

  var loadScript = function (src, callback) {
    var script = window.document.createElement("script");
    script.setAttribute("src", src);
    script.setAttribute("onload", callback);
    window.document.body.appendChild(script);
  };

  var loadStyle = function (src) {
    var link = document.createElement("link");
    link.setAttribute("href", src);
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    document.head.appendChild(link);
  };

  loadStyle("css/piskel-style-packaged" + version + ".css");
  loadScript("js/piskel-packaged-min" + version + ".js", "_onPiskelReady()");
})();
