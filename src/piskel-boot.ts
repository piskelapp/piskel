(function () {
  /**
   * This file is compiled to JavaScript and inlined into index.html via
   * @@include('piskel-boot.ts'). During build, the html-include vite plugin
   * replaces @@version with the build timestamp (e.g. '-2026-04-05-12-19').
   */
  const version = "@@version";

  if (!window.piskelReadyCallbacks) {
    window.piskelReadyCallbacks = [];
  }

  window._onPiskelReady = function () {
    const loadingMask = document.getElementById("loading-mask");
    if (loadingMask === null) {
      throw new Error("Missing element: #loading-mask");
    }
    const mask = loadingMask;
    mask.style.opacity = "0";
    window.setTimeout(function () {
      const parent = mask.parentNode;
      if (parent === null) {
        throw new Error("Missing parent of #loading-mask");
      }
      parent.removeChild(mask);
    }, 600);
    const init = window.pskl.app.init;
    if (init === undefined) {
      throw new Error("Missing pskl.app.init");
    }
    init();
    window.pskl._releaseVersion = "@@releaseVersion";

    for (let i = 0; i < window.piskelReadyCallbacks.length; i++) {
      window.piskelReadyCallbacks[i]();
    }
  };

  const loadScript = function (src: string, callback: string): void {
    const script = window.document.createElement("script");
    script.setAttribute("src", src);
    script.setAttribute("onload", callback);
    window.document.body.appendChild(script);
  };

  const loadStyle = function (src: string): void {
    const link = document.createElement("link");
    link.setAttribute("href", src);
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    document.head.appendChild(link);
  };

  loadStyle("css/piskel-style-packaged" + version + ".css");
  loadScript("js/piskel-packaged-min" + version + ".js", "_onPiskelReady()");
})();
