(function () {
  var ns = $.namespace('pskl.service.palette.reader');

  var RE_COLOR_LINE = /^[A-F0-9]{2}([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})/;

  ns.PaletteTxtReader = function (file, onSuccess, onError) {
    this.superclass.constructor.call(this, file, onSuccess, onError, RE_COLOR_LINE);
  };

  pskl.utils.inherit(ns.PaletteTxtReader, ns.AbstractPaletteFileReader);

  ns.PaletteTxtReader.prototype.extractColorFromLine = function (line) {
    var matches = line.match(RE_COLOR_LINE);
    var color = '#' + matches[1] + matches[2] + matches[3];
    return color.toLowerCase();
  };
})();
