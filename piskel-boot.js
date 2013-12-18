(function () {
  var prefixPath = function (path) {
    if (window.pskl && window.pskl.appEngineToken_) {
      return '../' + path;
    } else {
      return path;
    }
  };

  var loadScript = function (src, callback) {
    src = prefixPath(src);
    var script = window.document.createElement('script');
    script.setAttribute('src',src);
    script.setAttribute('onload',callback);
    window.document.body.appendChild(script);
  };

  var loadStyle = function (src) {
    src = prefixPath(src);
    var link = document.createElement('link');
    link.setAttribute('href', src);
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    document.head.appendChild(link);
  };

  if (window.location.href.indexOf("debug") != -1) {
    window.exports = {};
    var scriptIndex = 0;
    window.loadNextScript = function () {
      if (scriptIndex == window.exports.scripts.length) {
        pskl.app.init();
        // cleanup
        delete window.exports;
        delete window.loadDebugScripts;
        delete window.done;
      } else {
        loadScript(window.exports.scripts[scriptIndex], "loadNextScript()");
        scriptIndex ++;
      }
    };
    loadScript("piskel-script-list.js", "loadNextScript()");

    window.loadStyles = function () {
      var styles = window.exports.styles;
      for (var i = 0 ; i < styles.length ; i++) {
        loadStyle(styles[i]);
      }
    };
    loadScript("piskel-style-list.js", "loadStyles()");
  } else {
    var script;
    if (window.location.href.indexOf("pack") != -1) {
      script = "build/piskel-packaged.js";
    } else {
      script = "build/piskel-packaged-min.js";
    }
    loadStyle('build/piskel-style-packaged.css');

    var loaderInterval = window.setInterval(function () {
      if (document.querySelectorAll("[data-iframe-loader]").length === 0) {
        window.clearInterval(loaderInterval);
        loadScript(script, "pskl.app.init()");
      } else {
        console.log("waiting for templates to load ....");
      }
    }, 100);
  }
})();