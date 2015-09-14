(function () {
  var ns = $.namespace('pskl.utils');

  ns.FunctionUtils = {
    memo : function (fn, cache, scope) {
      var memoized = function () {
        var key = Array.prototype.join.call(arguments, '-');
        if (!cache[key]) {
          cache[key] = fn.apply(scope, arguments);
        }
        return cache[key];
      };
      return memoized;
    }
  };
})();
