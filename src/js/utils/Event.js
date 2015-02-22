(function () {
  var ns = $.namespace('pskl.utils');

  ns.Event = {};

  ns.Event.addEventListener = function (el, type, callback, scope, args) {
    var listener = {
      el : el,
      type : type,
      callback : callback,
      handler : args ? callback.bind(scope, args) : callback.bind(scope)
    };

    scope.__pskl_listeners = scope.__pskl_listeners || [];
    scope.__pskl_listeners.push(listener);
    el.addEventListener(type, listener.handler);
  };

  ns.Event.removeEventListener = function (el, type, callback, scope) {
    if (scope && scope.__pskl_listeners) {
      var listeners = scope.__pskl_listeners;
      for (var i = 0 ; i < listeners.length ; i++) {
        if (listeners[i].callback === callback) {
          el.removeEventListener(type, listeners[i].handler);
          listeners.slice(i, 1);
          break;
        }
      }
    }
  };

  ns.Event.removeAllEventListeners = function (scope) {
    if (scope && scope.__pskl_listeners) {
      var listeners = scope.__pskl_listeners;
      for (var i = 0 ; i < listeners.length ; i++) {
        var listener = listeners[i];
        listener.el.removeEventListener(listener.type, listener.handler);
      }
      scope.__pskl_listeners = [];
    }
  };
})();