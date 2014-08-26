jQuery.namespace = function() {
  var a=arguments, o=null, i, j, d;
  for (i=0; i<a.length; i=i+1) {
    d=a[i].split(".");
    o=window;
    for (j=0; j<d.length; j=j+1) {
      o[d[j]]=o[d[j]] || {};
      o=o[d[j]];
    }
  }
  return o;
};

/**
 * Need a polyfill for PhantomJS
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var bindArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          var args = bindArgs.concat(Array.prototype.slice.call(arguments));
          return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, args);
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

/**
 * @provide pskl.utils
 *
 * @require Constants
 */
(function() { // namespace: pskl.utils

  var ns = $.namespace("pskl.utils");

  ns.rgbToHex = function(r, g, b) {
    if (r > 255 || g > 255 || b > 255) {
      throw "Invalid color component";
    }

    return ((r << 16) | (g << 8) | b).toString(16);
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

})();

