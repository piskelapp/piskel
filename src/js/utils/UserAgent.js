(function () {
  var ns = $.namespace("pskl.utils");
  var ua = navigator.userAgent;

  ns.UserAgent = {
    isEdge: /edge\//i.test(ua),
    isFirefox: /Firefox/i.test(ua),
    isMac: /Mac/.test(ua),
    isOpera: /OPR\//.test(ua),
    hasChrome: /Chrome/i.test(ua),
    // Other iOS browsers are built on WebKit and their user agents also
    // contain Safari, these tokens are what tell them apart from Safari.
    hasIOSBrowser: /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)
  };

  ns.UserAgent.isChrome =
    ns.UserAgent.hasChrome && !ns.UserAgent.isOpera && !ns.UserAgent.isEdge;
  // Chromium browsers also contain AppleWebKit in their user agents.
  ns.UserAgent.isWebkit = /AppleWebKit\//.test(ua) && !ns.UserAgent.hasChrome;
  ns.UserAgent.isSafari =
    ns.UserAgent.isWebkit &&
    ns.UserAgent.isMac &&
    /Version\/.+Safari\//.test(ua) &&
    !ns.UserAgent.hasIOSBrowser;

  ns.UserAgent.supportedUserAgents = ["isEdge", "isChrome", "isFirefox"];

  ns.UserAgent.version = (function () {
    if (pskl.utils.UserAgent.isChrome) {
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
    if (ns.UserAgent.isChrome) {
      return "Chrome";
    } else if (ns.UserAgent.isFirefox) {
      return "Firefox";
    } else if (ns.UserAgent.isSafari) {
      return "Safari";
    } else if (ns.UserAgent.isOpera) {
      return "Opera";
    } else if (ns.UserAgent.isWebkit) {
      return "WebKit";
    } else {
      return ua;
    }
  };
})();
