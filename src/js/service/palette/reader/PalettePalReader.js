(function () {
  var ns = $.namespace('pskl.service.palette.reader');

  var RE_COLOR_LINE = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/;

  ns.PalettePalReader = function (file, onSuccess, onError) {
    this.superclass.constructor.call(this, file, onSuccess, onError, RE_COLOR_LINE);
  };

  pskl.utils.inherit(ns.PalettePalReader, ns.AbstractPaletteFileReader);

  ns.PalettePalReader.prototype.extractColorFromLine = function (line) {
    var matches = line.match(RE_COLOR_LINE);
    var rgbColor = 'rgb(' + matches[1] + ',' + matches[2] + ',' + matches[3] + ')';
    var color = window.tinycolor(rgbColor);

    return color.toHexString();
  };
})();
