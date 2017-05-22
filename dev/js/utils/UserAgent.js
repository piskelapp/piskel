(function () {
  var ns = $.namespace('pskl.utils');
  var ua = navigator.userAgent;

  var hasChrome =

  ns.UserAgent = {
    isIE : /MSIE/i.test(ua),
    isIE11 : /trident/i.test(ua),
    isEdge : /edge\//i.test(ua),
    isFirefox : /Firefox/i.test(ua),
    isMac : /Mac/.test(ua),
    isOpera : /OPR\//.test(ua),
    // Shared user agent strings, sadly found in many useragent strings
    hasChrome : /Chrome/i.test(ua),
    hasSafari : /Safari\//.test(ua),
  };

  ns.UserAgent.isChrome = ns.UserAgent.hasChrome && !ns.UserAgent.isOpera && !ns.UserAgent.isEdge;
  ns.UserAgent.isSafari = ns.UserAgent.hasSafari && !ns.UserAgent.isOpera && !ns.UserAgent.isEdge;

  ns.UserAgent.supportedUserAgents = [
    'isIE11',
    'isEdge',
    'isChrome',
    'isFirefox'
  ];

  ns.UserAgent.version = (function () {
    if (pskl.utils.UserAgent.isIE) {
      return parseInt(/MSIE\s?(\d+)/i.exec(ua)[1], 10);
    } else if (pskl.utils.UserAgent.isChrome) {
      return parseInt(/Chrome\/(\d+)/i.exec(ua)[1], 10);
    } else if (pskl.utils.UserAgent.isFirefox) {
      return parseInt(/Firefox\/(\d+)/i.exec(ua)[1], 10);
    }
  })();

  ns.UserAgent.isUnsupported = function () {
    // Check that none of the supported UAs are set to true.
    return ns.UserAgent.supportedUserAgents.every(function (uaTest) {
      return !ns.UserAgent[uaTest];
    });
  };

  ns.UserAgent.getDisplayName = function () {
    if (ns.UserAgent.isIE) {
      return 'Internet Explorer';
    } else if (ns.UserAgent.isChrome) {
      return 'Chrome';
    } else if (ns.UserAgent.isFirefox) {
      return 'Firefox';
    } else if (ns.UserAgent.isSafari) {
      return 'Safari';
    } else if (ns.UserAgent.isOpera) {
      return 'Opera';
    } else {
      return ua;
    }
  };
})();
