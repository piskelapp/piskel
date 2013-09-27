(function () {

  var loadScript = function (src, callback) {
    var script = window.document.createElement('script');
    script.setAttribute('src',src);
    script.setAttribute('onload',callback);
    window.document.body.appendChild(script);
  };

  if (window.location.href.indexOf("debug") != -1) {
    window.exports = {};
    //debug shortcuts
    cl = function () {console.log.apply(console, arguments)};
    d = function () {debugger};
    var scriptIndex = 0;
    window.loadNextScript = function () {
      if (scriptIndex == exports.scripts.length) {
        pskl.app.init();
        // cleanup
        delete window.exports;
        delete window.loadDebugScripts;
        delete window.done;
      } else {
        loadScript(exports.scripts[scriptIndex], "loadNextScript()");
        scriptIndex ++;
      }
    };
    loadScript("piskel-script-list.js", "loadNextScript()");
  } else {
    var script;
    if (window.location.href.indexOf("pack") != -1) {
      script = "build/piskel-packaged.js";
    } else {
      script = "build/piskel-packaged-min.js";
    }
    var loaderInterval = window.setInterval(function () {
      if (document.querySelectorAll("._ctl").length === 0) {
        window.clearInterval(loaderInterval);
        loadScript(script, "pskl.app.init()");
      } else {
        console.log("waiting for templates to load ....");
      }
    }, 100);
  }
})();