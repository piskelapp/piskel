(function () {
  var ns = $.namespace('pskl.service.palette.reader');

  var RE_COLOR_LINE = /^(\s*\d{1,3})(\s*\d{1,3})(\s*\d{1,3})/;
  var RE_EXTRACT_NAME = /^name\s*\:\s*(.*)$/i;

  ns.PaletteGplReader = function (file, onSuccess, onError) {
    this.superclass.constructor.call(this, file, onSuccess, onError, RE_COLOR_LINE);
  };

  pskl.utils.inherit(ns.PaletteGplReader, ns.AbstractPaletteFileReader);

  ns.PaletteGplReader.prototype.extractColorFromLine = function (line) {
    var matches = line.match(RE_COLOR_LINE);
    var color = window.tinycolor({
      r : parseInt(matches[1], 10),
      g : parseInt(matches[2], 10),
      b : parseInt(matches[3], 10)
    });

    return color.toHexString();
  };
})();
