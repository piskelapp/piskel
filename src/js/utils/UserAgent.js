(function () {
  var ns = $.namespace('pskl.utils');
  var ua = navigator.userAgent;

  ns.UserAgent = {
    isIE : /MSIE/i.test(ua),
    isIE11 : /trident/i.test(ua),
    isChrome : /Chrome/i.test(ua),
    isFirefox : /Firefox/i.test(ua),
    isMac : /Mac/.test(ua)
  };

  ns.UserAgent.version = (function () {
    if (pskl.utils.UserAgent.isIE) {
      return parseInt(/MSIE\s?(\d+)/i.exec(ua)[1], 10);
    } else if (pskl.utils.UserAgent.isChrome) {
      return parseInt(/Chrome\/(\d+)/i.exec(ua)[1], 10);
    } else if (pskl.utils.UserAgent.isFirefox) {
      return parseInt(/Firefox\/(\d+)/i.exec(ua)[1], 10);
    }
  })();
})();
