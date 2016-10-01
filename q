[1mdiff --git a/img/cursors/circle.png b/img/cursors/circle.png[m
[1mindex a186a26..eba4637 100644[m
Binary files a/img/cursors/circle.png and b/img/cursors/circle.png differ
[1mdiff --git a/img/cursors/stroke.png b/img/cursors/stroke.png[m
[1mindex 0bfecd5..641f438 100644[m
Binary files a/img/cursors/stroke.png and b/img/cursors/stroke.png differ
[1mdiff --git a/img/icons.png b/img/icons.png[m
[1mindex 3b474d1..2fea01d 100644[m
Binary files a/img/icons.png and b/img/icons.png differ
[1mdiff --git a/img/icons/tools/tool-lasso-select.png b/img/icons/tools/tool-lasso-select.png[m
[1mindex cd8d04d..f388925 100644[m
Binary files a/img/icons/tools/tool-lasso-select.png and b/img/icons/tools/tool-lasso-select.png differ
[1mdiff --git a/img/icons/tools/tool-lasso-select@2x.png b/img/icons/tools/tool-lasso-select@2x.png[m
[1mindex 39e3359..17e7162 100644[m
Binary files a/img/icons/tools/tool-lasso-select@2x.png and b/img/icons/tools/tool-lasso-select@2x.png differ
[1mdiff --git a/img/icons/tools/tool-shape-select.png b/img/icons/tools/tool-shape-select.png[m
[1mindex 2c7ed31..55d6400 100644[m
Binary files a/img/icons/tools/tool-shape-select.png and b/img/icons/tools/tool-shape-select.png differ
[1mdiff --git a/img/icons/tools/tool-shape-select@2x.png b/img/icons/tools/tool-shape-select@2x.png[m
[1mindex 5430e5b..fed2da9 100644[m
Binary files a/img/icons/tools/tool-shape-select@2x.png and b/img/icons/tools/tool-shape-select@2x.png differ
[1mdiff --git a/img/icons@2x.png b/img/icons@2x.png[m
[1mindex 00275b7..74b86c6 100644[m
Binary files a/img/icons@2x.png and b/img/icons@2x.png differ
[1mdiff --git a/index.html b/index.html[m
[1mindex da606eb..18eb1fa 100644[m
[1m--- a/index.html[m
[1m+++ b/index.html[m
[36m@@ -935,6 +935,15 @@[m
       </div>[m
       <button type="button" class="button button-primary c-download-button">Download C file</button>[m
     </div>[m
[32m+[m[32m    <div class="export-panel-section">[m
[32m+[m[32m      <div style="padding-bottom: 5px">[m
[32m+[m[32m        <span style="color: gold;">Export selected frame as PNG File: </span>[m
[32m+[m[32m        <span class="export-info">[m
[32m+[m[32m          PNG export of the currently selected frame.[m
[32m+[m[32m        </span>[m
[32m+[m[32m      </div>[m
[32m+[m[32m      <button type="button" class="button button-primary selected-frame-download-button">Download</button>[m
[32m+[m[32m    </div>[m
   </div>[m
 </script>[m
 [m
[36m@@ -942,15 +951,19 @@[m
     (function () {[m
 [m
   /**[m
[31m-   * See @Gruntfile.js => after build, -2016-07-24-05-08 is replaced by the build version[m
[32m+[m[32m   * See @Gruntfile.js => after build, -2016-10-01-02-48 is replaced by the build version[m
    */[m
[31m-  var version = '-2016-07-24-05-08';[m
[32m+[m[32m  var version = '-2016-10-01-02-48';[m
   var versionHasNotBeenReplaced = version.indexOf('@@') === 0;[m
   if (versionHasNotBeenReplaced)  {[m
     version = '';[m
   }[m
 [m
[31m-  window.onPiskelReady = function () {[m
[32m+[m[32m  if (!window.piskelReadyCallbacks) {[m
[32m+[m[32m    window.piskelReadyCallbacks = [];[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  window._onPiskelReady = function () {[m
     var loadingMask = document.getElementById('loading-mask');[m
     loadingMask.style.opacity = 0;[m
     window.setTimeout(function () {loadingMask.parentNode.removeChild(loadingMask);}, 600);[m
[36m@@ -959,6 +972,11 @@[m
     delete window.pskl_exports;[m
     delete window.loadDebugScripts;[m
     delete window.done;[m
[32m+[m
[32m+[m[32m    // Run Piskel ready callbacks[m
[32m+[m[32m    for (var i = 0; i < window.piskelReadyCallbacks.length; i++) {[m
[32m+[m[32m      window.piskelReadyCallbacks[i]();[m
[32m+[m[32m    }[m
   };[m
 [m
   var prefixPath = function (path) {[m
[36m@@ -991,7 +1009,7 @@[m
     var scriptIndex = 0;[m
     window.loadNextScript = function () {[m
       if (scriptIndex == window.pskl_exports.scripts.length) {[m
[31m-        window.onPiskelReady();[m
[32m+[m[32m        window._onPiskelReady();[m
       } else {[m
         loadScript(window.pskl_exports.scripts[scriptIndex], 'loadNextScript()');[m
         scriptIndex ++;[m
[36m@@ -1015,7 +1033,7 @@[m
     }[m
 [m
     loadStyle('css/piskel-style-packaged' + version + '.css');[m
[31m-    loadScript(script, 'onPiskelReady()');[m
[32m+[m[32m    loadScript(script, '_onPiskelReady()');[m
   }[m
 })();[m
   </script>[m
[1mdiff --git a/piskelapp-partials/main-partial.html b/piskelapp-partials/main-partial.html[m
[1mindex 9060764..de5d984 100644[m
[1m--- a/piskelapp-partials/main-partial.html[m
[1m+++ b/piskelapp-partials/main-partial.html[m
[36m@@ -887,6 +887,15 @@[m
     </div>[m
     <button type="button" class="button button-primary c-download-button">Download C file</button>[m
   </div>[m
[32m+[m[32m  <div class="export-panel-section">[m
[32m+[m[32m    <div style="padding-bottom: 5px">[m
[32m+[m[32m      <span style="color: gold;">Export selected frame as PNG File: </span>[m
[32m+[m[32m      <span class="export-info">[m
[32m+[m[32m        PNG export of the currently selected frame.[m
[32m+[m[32m      </span>[m
[32m+[m[32m    </div>[m
[32m+[m[32m    <button type="button" class="button button-primary selected-frame-download-button">Download</button>[m
[32m+[m[32m  </div>[m
 </div>[m
 </script>[m
 [m
[36m@@ -894,15 +903,19 @@[m
   (function () {[m
 [m
 /**[m
[31m- * See @Gruntfile.js => after build, -2016-07-24-05-08 is replaced by the build version[m
[32m+[m[32m * See @Gruntfile.js => after build, -2016-10-01-02-48 is replaced by the build version[m
  */[m
[31m-var version = '-2016-07-24-05-08';[m
[32m+[m[32mvar version = '-2016-10-01-02-48';[m
 var versionHasNotBeenReplaced = version.indexOf('@@') === 0;[m
 if (versionHasNotBeenReplaced)  {[m
   version = '';[m
 }[m
 [m
[31m-window.onPiskelReady = function () {[m
[32m+[m[32mif (!window.piskelReadyCallbacks) {[m
[32m+[m[32m  window.piskelReadyCallbacks = [];[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mwindow._onPiskelReady = function () {[m
   var loadingMask = document.getElementById('loading-mask');[m
   loadingMask.style.opacity = 0;[m
   window.setTimeout(function () {loadingMask.parentNode.removeChild(loadingMask);}, 600);[m
[36m@@ -911,6 +924,11 @@[m [mwindow.onPiskelReady = function () {[m
   delete window.pskl_exports;[m
   delete window.loadDebugScripts;[m
   delete window.done;[m
[32m+[m
[32m+[m[32m  // Run Piskel ready callbacks[m
[32m+[m[32m  for (var i = 0; i < window.piskelReadyCallbacks.length; i++) {[m
[32m+[m[32m    window.piskelReadyCallbacks[i]();[m
[32m+[m[32m  }[m
 };[m
 [m
 var prefixPath = function (path) {[m
[36m@@ -943,7 +961,7 @@[m [mif (window.location.href.indexOf('debug') != -1) {[m
   var scriptIndex = 0;[m
   window.loadNextScript = function () {[m
     if (scriptIndex == window.pskl_exports.scripts.length) {[m
[31m-      window.onPiskelReady();[m
[32m+[m[32m      window._onPiskelReady();[m
     } else {[m
       loadScript(window.pskl_exports.scripts[scriptIndex], 'loadNextScript()');[m
       scriptIndex ++;[m
[36m@@ -967,7 +985,7 @@[m [mif (window.location.href.indexOf('debug') != -1) {[m
   }[m
 [m
   loadStyle('css/piskel-style-packaged' + version + '.css');[m
[31m-  loadScript(script, 'onPiskelReady()');[m
[32m+[m[32m  loadScript(script, '_onPiskelReady()');[m
 }[m
 })();[m
 </script>[m
