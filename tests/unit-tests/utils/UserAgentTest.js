describe('UserAgent test', function () {
  var parse = pskl.utils.UserAgent.parse;

  var MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
  var WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  var IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
  var IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)';
  var LINUX = 'Mozilla/5.0 (X11; Linux x86_64)';
  var WEBKIT = 'AppleWebKit/605.1.15 (KHTML, like Gecko)';
  var BLINK = 'AppleWebKit/537.36 (KHTML, like Gecko)';

  var browsers = [
    {
      name: 'Safari on macOS',
      ua: MAC + ' ' + WEBKIT + ' Version/17.0 Safari/605.1.15',
      isWebkit: true, isSafari: true, displayName: 'Safari', isUnsupported: true
    },
    {
      name: 'Safari on iPhone',
      ua: IPHONE + ' ' + WEBKIT + ' Version/17.0 Mobile/15E148 Safari/604.1',
      isWebkit: true, isSafari: true, displayName: 'Safari', isUnsupported: true
    },
    {
      name: 'Safari on iPad',
      ua: IPAD + ' ' + WEBKIT + ' Version/17.0 Mobile/15E148 Safari/604.1',
      isWebkit: true, isSafari: true, displayName: 'Safari', isUnsupported: true
    },
    {
      name: 'Chrome on iOS',
      ua: IPHONE + ' ' + WEBKIT + ' CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
      isWebkit: true, isSafari: false, displayName: 'WebKit', isUnsupported: true
    },
    {
      name: 'Chrome on iOS requesting the desktop site',
      ua: MAC + ' ' + WEBKIT + ' CriOS/120 Version/11.1.1 Safari/605.1.15',
      isWebkit: true, isSafari: false, displayName: 'WebKit', isUnsupported: true
    },
    {
      name: 'Firefox on iOS',
      ua: IPHONE + ' ' + WEBKIT + ' FxiOS/120.0 Mobile/15E148 Safari/605.1.15',
      isWebkit: true, isSafari: false, displayName: 'WebKit', isUnsupported: true
    },
    {
      name: 'Edge on iOS',
      ua: IPHONE + ' ' + WEBKIT + ' Version/17.0 EdgiOS/120.0 Mobile/15E148 Safari/604.1',
      isWebkit: true, isSafari: false, displayName: 'WebKit', isUnsupported: true
    },
    {
      name: 'Opera on iOS',
      ua: IPHONE + ' ' + WEBKIT + ' Version/17.0 OPT/4.0 Mobile/15E148 Safari/604.1',
      isWebkit: true, isSafari: false, displayName: 'WebKit', isUnsupported: true
    },
    {
      name: 'GNOME Web',
      ua: LINUX + ' ' + WEBKIT + ' Version/16.0 Safari/605.1.15',
      isWebkit: true, isSafari: false, displayName: 'WebKit', isUnsupported: true
    },
    {
      name: 'Chrome on macOS',
      ua: MAC + ' ' + BLINK + ' Chrome/120.0.0.0 Safari/537.36',
      isWebkit: false, isSafari: false, displayName: 'Chrome', isUnsupported: false
    },
    {
      name: 'Chromium-based Edge',
      ua: WINDOWS + ' ' + BLINK + ' Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      isWebkit: false, isSafari: false, displayName: 'Chrome', isUnsupported: false
    },
    {
      name: 'Android WebView',
      ua: 'Mozilla/5.0 (Linux; Android 10; wv) ' + BLINK + ' Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36',
      isWebkit: false, isSafari: false, displayName: 'Chrome', isUnsupported: false
    },
    {
      name: 'Opera on macOS',
      ua: MAC + ' ' + BLINK + ' Chrome/120.0.0.0 Safari/537.36 OPR/105.0.0.0',
      isWebkit: false, isSafari: false, displayName: 'Opera', isUnsupported: true
    },
    {
      name: 'Firefox on macOS',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
      isWebkit: false, isSafari: false, displayName: 'Firefox', isUnsupported: false
    }
  ];

  browsers.forEach(function (browser) {
    it('detects ' + browser.name, function () {
      var userAgent = parse(browser.ua);
      expect(userAgent.isWebkit).toBe(browser.isWebkit);
      expect(userAgent.isSafari).toBe(browser.isSafari);
      expect(userAgent.getDisplayName()).toBe(browser.displayName);
      expect(userAgent.isUnsupported()).toBe(browser.isUnsupported);
    });
  });

  it('falls back to the raw user agent as display name', function () {
    var ua = 'Some unknown browser/1.0';
    expect(parse(ua).getDisplayName()).toBe(ua);
  });

  it('treats legacy Edge as supported but not as Chrome', function () {
    var userAgent = parse(WINDOWS + ' ' + BLINK + ' Chrome/70.0.3538.102 Safari/537.36 Edge/18.0');
    expect(userAgent.isEdge).toBe(true);
    expect(userAgent.isChrome).toBe(false);
    expect(userAgent.isWebkit).toBe(false);
    expect(userAgent.isUnsupported()).toBe(false);
  });

  it('reads the major version of Chrome and Firefox only', function () {
    expect(parse(MAC + ' ' + BLINK + ' Chrome/120.0.0.0 Safari/537.36').version).toBe(120);
    expect(parse('Mozilla/5.0 (Windows NT 10.0; rv:115.0) Gecko/20100101 Firefox/115.0').version).toBe(115);
    expect(parse(MAC + ' ' + WEBKIT + ' Version/17.0 Safari/605.1.15').version).toBeUndefined();
  });
});
