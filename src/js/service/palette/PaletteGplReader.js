(function () {
  var ns = $.namespace('pskl.service.palette');

  var RE_COLOR_LINE = /^(\d{1,3}\s+)(\d{1,3}\s+)(\d{1,3}\s+)/;
  var RE_EXTRACT_NAME = /^name\s*\:\s*(.*)$/i;

  ns.PaletteGplReader = function (file, onSuccess, onError) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;
  };

  ns.PaletteGplReader.prototype.read = function () {
    pskl.utils.FileUtils.readFile(this.file, this.onFileLoaded_.bind(this));
  };

  ns.PaletteGplReader.prototype.onFileLoaded_ = function (content) {
    var text = pskl.utils.Base64.toText(content);
    var lines = text.match(/[^\r\n]+/g);

    var name = lines.map(function (l) {
      var matches = l.match(RE_EXTRACT_NAME);
      return matches ? matches[1] : '';
    }).join('');

    var colorLines = lines.filter(function (l) {
      return RE_COLOR_LINE.test(l);
    });

    var colors = colorLines.map(function (l) {
      var matches = l.match(RE_COLOR_LINE);
      var color = window.tinycolor({
        r : parseInt(matches[1], 10),
        g : parseInt(matches[2], 10),
        b : parseInt(matches[3], 10)
      });

      return color.toRgbString();
    });

    if (name && colors.length) {
      var uuid = pskl.utils.Uuid.generate();
      var palette = new pskl.model.Palette(uuid, name, colors);
      this.onSuccess(palette);
    } else {
      this.onError();
    }

  };
})();