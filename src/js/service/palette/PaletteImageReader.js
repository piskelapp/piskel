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
    var imageProcessor = new pskl.worker.ImageProcessor(image,
      this.onWorkerSuccess_.bind(this),
      this.onWorkerStep_.bind(this),
      this.onWorkerError_.bind(this));
    imageProcessor.process();
  };

  ns.PaletteImageReader.prototype.onWorkerSuccess_ = function (event) {
    var data = event.data;
    var colorsMap = data.colorsMap;

    var colors = Object.keys(colorsMap);

    if (colors.length > 200) {
      this.onError('Too many colors : ' + colors.length);
    } else {
      var uuid = pskl.utils.Uuid.generate();
      var palette = new pskl.model.Palette(uuid, this.file.name + ' palette', colors);

      this.onSuccess(palette);
    }
  };
  ns.PaletteImageReader.prototype.onWorkerStep_ = function (event) {
    var data = event.data;
    var step = data.step;
    var total = data.total;

    var progress = ((step/total)*100).toFixed(1);

    if (this.currentProgress !== progress) {
      this.currentProgress = progress;
      console.log("Image processing completed at : " + progress + "%");
    }
  };
  ns.PaletteImageReader.prototype.onWorkerError_ = function (event) {
    this.onError('Unable to process the image : ' + event.data.message);
  };
})();