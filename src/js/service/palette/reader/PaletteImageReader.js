(function () {
  var ns = $.namespace('pskl.service.palette.reader');

  ns.PaletteImageReader = function (file, onSuccess, onError) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.colorSorter_ = new pskl.service.color.ColorSorter();
  };

  ns.PaletteImageReader.prototype.read = function () {
    pskl.utils.FileUtils.readImageFile(this.file, this.onImageLoaded_.bind(this));
  };

  ns.PaletteImageReader.prototype.onImageLoaded_ = function (image) {
    var imageProcessor = new pskl.worker.imageprocessor.ImageProcessor(image,
      this.onWorkerSuccess_.bind(this),
      this.onWorkerStep_.bind(this),
      this.onWorkerError_.bind(this));

    $.publish(Events.SHOW_PROGRESS, [{'name': 'Processing image colors ...'}]);

    imageProcessor.process();
  };

  ns.PaletteImageReader.prototype.onWorkerSuccess_ = function (event) {
    var data = event.data;
    var colorsMap = data.colorsMap;

    var colors = Object.keys(colorsMap);

    if (colors.length > Constants.MAX_PALETTE_COLORS) {
      this.onError('Too many colors : ' + colors.length);
    } else {
      var uuid = pskl.utils.Uuid.generate();
      var sortedColors = this.colorSorter_.sort(colors);
      var palette = new pskl.model.Palette(uuid, this.file.name + ' palette', sortedColors);

      this.onSuccess(palette);
    }
    $.publish(Events.HIDE_PROGRESS);
  };

  ns.PaletteImageReader.prototype.onWorkerStep_ = function (event) {
    var progress = event.data.progress;
    $.publish(Events.UPDATE_PROGRESS, [{'progress': progress}]);
  };

  ns.PaletteImageReader.prototype.onWorkerError_ = function (event) {
    $.publish(Events.HIDE_PROGRESS);
    this.onError('Unable to process the image : ' + event.data.message);
  };
})();
