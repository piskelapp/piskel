(function () {
  var ns = $.namespace('pskl.service.palette');

  var RE_COLOR_LINE = /^[A-F0-9]{2}([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})/;

  ns.PaletteTxtReader = function (file, onSuccess, onError) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;
  };

  ns.PaletteTxtReader.prototype.read = function () {
    pskl.utils.FileUtils.readFile(this.file, this.onFileLoaded_.bind(this));
  };

  ns.PaletteTxtReader.prototype.onFileLoaded_ = function (content) {
    var text = pskl.utils.Base64.toText(content);
    var lines = text.match(/[^\r\n]+/g);

    var colorLines = lines.filter(function (l) {
      return RE_COLOR_LINE.test(l);
    });

    var colors = colorLines.map(function (l) {
      var matches = l.match(RE_COLOR_LINE);
      var color = "#" + matches[1] + matches[2] + matches[3];
      return color;
    });

    if (colors.length) {
      var uuid = pskl.utils.Uuid.generate();
      var palette = new pskl.model.Palette(uuid, 'Imported palette', colors);
      this.onSuccess(palette);
    } else {
      this.onError();
    }
  };
})();