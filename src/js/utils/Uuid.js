(function(){
  var ns = $.namespace('pskl.utils');

  var s4 = function () {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  };

  ns.Uuid = {
    generate : function () {
      return 'ss-s-s-s-sss'.replace(/s/g, function () {
        return s4();
      });
    }
  };
})();