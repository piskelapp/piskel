(function () {
  var ns = $.namespace('pskl.service.palette');

  ns.PaletteImageReader = function (file, onSuccess, onError) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;
  };

  ns.PaletteImageReader.prototype.read = function () {
    pskl.utils.FileUtils.readImageFile(this.file, this.onImageLoaded_.bind(this));
  };

  ns.PaletteImageReader.prototype.onImageLoaded_ = function (image) {
    var frame = pskl.utils.FrameUtils.createFromImage(image);
    var colorsMap = {};
    frame.forEachPixel(function (color, x, y) {
      colorsMap[color] = true;
    });

    delete colorsMap[Constants.TRANSPARENT_COLOR];

    var colors = Object.keys(colorsMap);
    var uuid = pskl.utils.Uuid.generate();
    var palette = new pskl.model.Palette(uuid, this.file.name + ' palette', colors);

    this.onSuccess(palette);
  };
})();