(function () {

  /**
   * See @Gruntfile.js => after build, @@version is replaced by the build version
   */
  var version = '@@version';
  var versionHasNotBeenReplaced = version.indexOf('@@') === 0;
  if (versionHasNotBeenReplaced)  {
    version = '';
  }

  if (!window.piskelReadyCallbacks) {
    window.piskelReadyCallbacks = [];
  }

  window._onPiskelReady = function () {
    var loadingMask = document.getElementById('loading-mask');
    loadingMask.style.opacity = 0;
    window.setTimeout(function () {loadingMask.parentNode.removeChild(loadingMask);}, 600);
    pskl.app.init();
    pskl._releaseVersion = '@@releaseVersion';
    // cleanup
    delete window.pskl_exports;
    delete window.loadDebugScripts;
    delete window.done;

    // Run Piskel ready callbacks
    for (var i = 0; i < window.piskelReadyCallbacks.length; i++) {
      window.piskelReadyCallbacks[i]();
    }
  };

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

  if (window.location.href.indexOf('debug') != -1) {
    window.pskl_exports = {};
    var scriptIndex = 0;
    window.loadNextScript = function () {
      if (scriptIndex == window.pskl_exports.scripts.length) {
        window._onPiskelReady();
      } else {
        loadScript(window.pskl_exports.scripts[scriptIndex], 'loadNextScript()');
        scriptIndex ++;
      }
    };
    loadScript('piskel-script-list.js', 'loadNextScript()');

    var styles;
    window.loadStyles = function () {
      styles = window.pskl_exports.styles;
      for (var i = 0 ; i < styles.length ; i++) {
        loadStyle(styles[i]);
      }
    };

    window.reloadStyles = function () {
      for (var i = 0 ; i < styles.length ; i++) {
        document.querySelector('link[href="' + styles[i] + '"]').remove();
        loadStyle(styles[i]);
      }
    };

    loadScript('piskel-style-list.js', 'loadStyles()');
  } else {
    var script;
    if (window.location.href.indexOf('pack') != -1) {
      script = 'js/piskel-packaged' + version + '.js';
    } else {
      script = 'js/piskel-packaged-min' + version + '.js';
    }

    loadStyle('css/piskel-style-packaged' + version + '.css');
    loadScript(script, '_onPiskelReady()');
  }
})();