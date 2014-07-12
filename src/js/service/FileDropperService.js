(function () {
  var ns = $.namespace('pskl.service');

  ns.FileDropperService = function (piskelController, drawingAreaContainer) {
    this.piskelController = piskelController;
    this.drawingAreaContainer = drawingAreaContainer;
  };

  ns.FileDropperService.prototype.init = function () {
    document.body.addEventListener('drop', this.onFileDrop.bind(this), false);
    document.body.addEventListener('dragover', this.onFileDragOver.bind(this), false);
  };

  ns.FileDropperService.prototype.onFileDragOver = function (event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  ns.FileDropperService.prototype.onFileDrop = function (event) {
    event.preventDefault();
    event.stopPropagation();


    this.coords_ = pskl.app.drawingController.getSpriteCoordinates(event.clientX, event.clientY);

    var files = event.dataTransfer.files;
    for (var i = 0; i < files.length ; i++) {
      var file = files[i];
      var isImage = file.type.indexOf('image') === 0;
      if (isImage) {
        this.readImageFile_(file);
      } else if (/\.piskel$/i.test(file.name)) {
        pskl.utils.PiskelFileUtils.loadFromFile(file, this.onPiskelFileLoaded_);
      }
    }
  };

  ns.FileDropperService.prototype.onPiskelFileLoaded_ = function (piskel, descriptor, fps) {
    if (window.confirm('This will replace your current animation')) {
      piskel.setDescriptor(descriptor);
      pskl.app.piskelController.setPiskel(piskel);
      pskl.app.animationController.setFPS(fps);
    }
  };

  ns.FileDropperService.prototype.readImageFile_ = function (imageFile) {
    pskl.utils.FileUtils.readFile(imageFile, this.processImageSource_.bind(this));
  };

  ns.FileDropperService.prototype.processImageSource_ = function (imageSource) {
    this.importedImage_ = new Image();
    this.importedImage_.onload = this.onImageLoaded_.bind(this);
    this.importedImage_.src = imageSource;
  };

  ns.FileDropperService.prototype.onImageLoaded_ = function () {
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