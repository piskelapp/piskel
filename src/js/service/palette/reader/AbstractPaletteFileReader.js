(function () {
  var ns = $.namespace('pskl.service.palette.reader');

  ns.AbstractPaletteFileReader = function (file, onSuccess, onError, colorLineRegexp) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.colorLineRegexp = colorLineRegexp;
  };

  ns.AbstractPaletteFileReader.prototype.extractColorFromLine = Constants.ABSTRACT_FUNCTION;

  ns.AbstractPaletteFileReader.prototype.read = function () {
    pskl.utils.FileUtils.readFile(this.file, this.onFileLoaded_.bind(this));
  };

  ns.AbstractPaletteFileReader.prototype.onFileLoaded_ = function (content) {
    var text = pskl.utils.Base64.toText(content);
    var lines = text.match(/[^\r\n]+/g);

    var colorLines = lines.filter(function (l) {
      return this.colorLineRegexp.test(l);
    }.bind(this));

    var colors = colorLines.map(this.extractColorFromLine.bind(this));

    if (colors.length) {
      var uuid = pskl.utils.Uuid.generate();
      var palette = new pskl.model.Palette(uuid, this.file.name, colors);
      this.onSuccess(palette);
    } else {
      this.onError();
    }
  };
})();
