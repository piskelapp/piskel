(function () {
  var ns = $.namespace('pskl.utils');

  var pad = function (num) {
    if (num < 10) {
      return '0' + num;
    } else {
      return '' + num;
    }
  };

  ns.DateUtils = {
    format : function (date, format) {
      date = new Date(date);
      return pskl.utils.Template.replace(format, {
        Y : date.getFullYear(),
        M : pad(date.getMonth() + 1),
        D : pad(date.getDate()),
        H : pad(date.getHours()),
        m : pad(date.getMinutes()),
        s : pad(date.getSeconds())
      });
    }
  };
})();
