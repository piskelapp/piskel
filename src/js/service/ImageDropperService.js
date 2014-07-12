(function () {
  var ns = $.namespace('pskl.service');

  ns.ImageDropperService = function (piskelController, drawingAreaContainer) {
    this.piskelController = piskelController;
    this.drawingAreaContainer = drawingAreaContainer;
  };

  ns.ImageDropperService.prototype.init = function () {
    document.body.addEventListener('drop', this.onFileDrop.bind(this), false);
    document.body.addEventListener('dragover', this.onFileDragOver.bind(this), false);
  };

  ns.ImageDropperService.prototype.onFileDrop = function (event) {
    event.preventDefault();
    event.stopPropagation();

    // FIXME : Ahah this is horrible
    this.coords_ = pskl.app.drawingController.getSpriteCoordinates(event);

    var files = event.dataTransfer.files;

    for (var i = 0; i < files.length ; i++) {
      var file = files[i];
      var isImage = file.type.indexOf('image') === 0;
      if (isImage) {
        this.readImageFile_(file);
      }
    }
  };

  ns.ImageDropperService.prototype.onFileDragOver = function (event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'Copy image on the frame'; // Explicitly show this is a copy.
  };


  ns.ImageDropperService.prototype.readImageFile_ = function (imageFile) {
    pskl.utils.FileUtils.readFile(imageFile, this.processImageSource_.bind(this));
  };

  ns.ImageDropperService.prototype.processImageSource_ = function (imageSource) {
    this.importedImage_ = new Image();
    this.importedImage_.onload = this.onImageLoaded_.bind(this);
    this.importedImage_.src = imageSource;
  };

  ns.ImageDropperService.prototype.onImageLoaded_ = function () {
    var frame = pskl.utils.FrameUtils.createFromImage(this.importedImage_);
    var currentFrame = this.piskelController.getCurrentFrame();

    var xCoord = this.coords_.x - Math.floor(frame.width/2);
    var yCoord = this.coords_.y - Math.floor(frame.height/2);
    xCoord = Math.max(0, xCoord);
    yCoord = Math.max(0, yCoord);

    if (frame.width <= currentFrame.width) {
      xCoord = Math.min(xCoord, currentFrame.width - frame.width);
    }

    if (frame.height <= currentFrame.height) {
      yCoord = Math.min(yCoord, currentFrame.height - frame.height);
    }
    currentFrame.forEachPixel(function (color, x, y) {
      var fColor = frame.getPixel(x-xCoord, y-yCoord);
      if (fColor && fColor != Constants.TRANSPARENT_COLOR) {
        currentFrame.setPixel(x, y, fColor);
      }
    });

    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };

})();