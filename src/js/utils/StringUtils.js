(function () {
  var ns = $.namespace('pskl.utils');

  ns.StringUtils = {
    leftPad : function (input, length, pad) {
      var padding = new Array(length).join(pad);
      return (padding + input).slice(-length);
    },
  };
})();
