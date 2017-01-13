jQuery.namespace = function() {
  var a = arguments;
  var o = null;
  for (var i = 0; i < a.length ; i++) {
    var d = a[i].split('.');
    o = window;
    for (var j = 0 ; j < d.length ; j++) {
      o[d[j]] = o[d[j]] || {};
      o = o[d[j]];
    }
  }
  return o;
};

/**
 * Need a polyfill for PhantomJS
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var bindArgs = Array.prototype.slice.call(arguments, 1);
    var fToBind = this;
    var FNOP = function () {};
    var fBound = function () {
      var args = bindArgs.concat(Array.prototype.slice.call(arguments));
      return fToBind.apply(this instanceof FNOP && oThis ? this : oThis, args);
    };

    FNOP.prototype = this.prototype;
    fBound.prototype = new FNOP();

    return fBound;
  };
}

/**
 * Polyfill for typedarrays' fill method for PhantomJS
 */
if (!Uint32Array.prototype.fill) {
  Uint32Array.prototype.fill = function (value, start, end) {
    start = typeof start === 'undefined' ? 0 : start;
    end = typeof end === 'undefined' ? this.length : end;

    if (start < 0) {
      start = this.length + start;
    }

    if (end < 0) {
      end = this.length + end;
    }

    for (var i = start; i < end; i++) {
      this[i] = value;
    }
  };
}

/**
 * @provide pskl.utils
 *
 * @require Constants
 */
(function() { // namespace: pskl.utils

  var ns = $.namespace('pskl.utils');

  /**
   * Convert a rgb(Number, Number, Number) color to hexadecimal representation
   * @param  {Number} r red value, between 0 and 255
   * @param  {Number} g green value, between 0 and 255
   * @param  {Number} b blue value, between 0 and 255
   * @return {String} hex representation of the color '#ABCDEF'
   */
  ns.rgbToHex = function (r, g, b) {
    return '#' + pskl.utils.componentToHex(r) + pskl.utils.componentToHex(g) + pskl.utils.componentToHex(b);
  };

  /**
   * Convert a color component (as a Number between 0 and 255) to its string hexa representation
   * @param  {Number} c component value, between 0 and 255
   * @return {String} eg. '0A'
   */
  ns.componentToHex = function (c) {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  };

  var intHexCache = {};
  ns.intToHex = function(int) {
    if (intHexCache[int]) {
      return intHexCache[int];
    }

    var hex = ns.rgbToHex(int & 0xff, int >> 8 & 0xff, int >> 16 & 0xff);
    intHexCache[int] = hex;
    return hex;
  };

  ns.normalize = function (value, def) {
    if (typeof value === 'undefined' || value === null) {
      return def;
    } else {
      return value;
    }
  };

  ns.inherit = function(extendedObject, inheritFrom) {
    extendedObject.prototype = Object.create(inheritFrom.prototype);
    extendedObject.prototype.constructor = extendedObject;
    extendedObject.prototype.superclass = inheritFrom.prototype;
  };

  ns.wrap = function (wrapper, wrappedObject) {
    for (var prop in wrappedObject) {
      if (typeof wrappedObject[prop] === 'function' && typeof wrapper[prop] === 'undefined') {
        wrapper[prop] = wrappedObject[prop].bind(wrappedObject);
      }
    }
  };

  ns.hashCode = function(str) {
    var hash = 0;
    if (str.length === 0) {
      return hash;
    }

    for (var i = 0, len = str.length, chr; i < len; i++) {
      chr = str.charCodeAt(i);
      hash = hash * 31 + chr;
      hash |= 0; // Convert to 32bit integer
    }

    return hash;
  };

  ns.copy = function (object) {
    return JSON.parse(JSON.stringify(object));
  };

  var entityMap = {
    '&' : '&amp;',
    '<' : '&lt;',
    '>' : '&gt;',
    '"' : '&quot;',
    '\'': '&#39;',
    '/' : '&#x2F;'
  };
  ns.escapeHtml = function (string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  };

  var colorCache = {};
  var colorCacheReverse = {};
  ns.colorToInt = function (color) {
    if (typeof color === 'number') {
      return color;
    }

    if (typeof colorCache[color] !== 'undefined') {
      return colorCache[color];
    }

    var tc = window.tinycolor(color);
    if (tc && tc.ok) {
      var rgb = tc.toRgb();
      var a = Math.round(rgb.a * 255);
      var intValue = (a << 24 >>> 0) + (rgb.b << 16) + (rgb.g << 8) + rgb.r;
      if (a === 0) {
        // assign all 'transparent' colors to 0, theoretically mapped to rgba(0,0,0,0) only
        intValue = 0;
      }
      colorCache[color] = intValue;
      colorCacheReverse[intValue] = color;
      return intValue;
    } else {
      // If tinycolor failed, determine color by using the browser
      var d = document.createElement('div');
      d.style.color = color;
      document.body.appendChild(d);

      // Color in RGB
      color = window.getComputedStyle(d).color;
      document.body.removeChild(d);

      return pskl.utils.colorToInt(color);
    }
  };

  ns.intToColor = function(intValue) {
    if (typeof intValue === 'string') {
      return intValue;
    }

    if (typeof colorCacheReverse[intValue] !== 'undefined') {
      return colorCacheReverse[intValue];
    }

    var r = intValue & 0xff;
    var g = intValue >> 8 & 0xff;
    var b = intValue >> 16 & 0xff;
    var a = (intValue >> 24 >>> 0 & 0xff) / 255;
    var color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';

    colorCache[color] = intValue;
    colorCacheReverse[intValue] = color;
    return color;
  };

  var reEntityMap = {};
  ns.unescapeHtml = function (string) {
    Object.keys(entityMap).forEach(function(key) {
      reEntityMap[key] = reEntityMap[key] || new RegExp(entityMap[key], 'g');
      string = string.replace(reEntityMap[key], key);
    });
    return string;
  };

})();
