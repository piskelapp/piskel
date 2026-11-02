(function () {
  var ns = $.namespace("pskl.utils");

  var parse = function (ua) {
    var userAgent = {
      isEdge: /edge\//i.test(ua),
      isFirefox: /Firefox/i.test(ua),
      isMac: /Mac/.test(ua),
      isOpera: /OPR\//.test(ua),
      hasChrome: /Chrome/i.test(ua),
      // Other iOS browsers are built on WebKit and their user agents also
      // contain Safari, these tokens are what tell them apart from Safari.
      hasIOSBrowser: /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)
    };

    userAgent.isChrome =
      userAgent.hasChrome && !userAgent.isOpera && !userAgent.isEdge;
    // Chromium browsers also contain AppleWebKit in their user agents.
    userAgent.isWebkit = /AppleWebKit\//.test(ua) && !userAgent.hasChrome;
    userAgent.isSafari =
      userAgent.isWebkit &&
      userAgent.isMac &&
      /Version\/.+Safari\//.test(ua) &&
      !userAgent.hasIOSBrowser;

    userAgent.supportedUserAgents = ["isEdge", "isChrome", "isFirefox"];

    userAgent.version = (function () {
      if (userAgent.isChrome) {
        return parseInt(/Chrome\/(\d+)/i.exec(ua)[1], 10);
      } else if (userAgent.isFirefox) {
        return parseInt(/Firefox\/(\d+)/i.exec(ua)[1], 10);
      }
    })();

    userAgent.isUnsupported = function () {
      // Check that none of the supported UAs are set to true.
      return userAgent.supportedUserAgents.every(function (uaTest) {
        return !userAgent[uaTest];
      });
    };

    userAgent.getDisplayName = function () {
      if (userAgent.isChrome) {
        return "Chrome";
      } else if (userAgent.isFirefox) {
        return "Firefox";
      } else if (userAgent.isSafari) {
        return "Safari";
      } else if (userAgent.isOpera) {
        return "Opera";
      } else if (userAgent.isWebkit) {
        return "WebKit";
      } else {
        return ua;
      }
    };

    return userAgent;
  };

  ns.UserAgent = parse(navigator.userAgent);
  ns.UserAgent.parse = parse;
})();
