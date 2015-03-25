/**
 *  detection method from:
 *  http://videlais.com/2014/08/23/lessons-learned-from-detecting-node-webkit/
 */

(function () {

  var ns = $.namespace('pskl.utils');

  ns.Environment = {
    detectNodeWebkit : function () {
      var isNode = (typeof window.process !== "undefined" && typeof window.require !== "undefined");
      var isNodeWebkit = false;
      if (isNode) {
        try {
          isNodeWebkit = (typeof window.require('nw.gui') !== "undefined");
        } catch (e) {
          isNodeWebkit = false;
        }
      }
      return isNodeWebkit;
    }
  };

})();
