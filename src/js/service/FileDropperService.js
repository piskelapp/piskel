(function () {
  var ns = $.namespace('pskl.service');

  ns.FileDropperService = function (piskelController, drawingAreaContainer) {
    this.piskelController = piskelController;
    this.drawingAreaContainer = drawingAreaContainer;
    this.dropPosition_ = null;
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

    this.dropPosition_ = {
      x : event.clientX,
      y : event.clientY
    };

    var files = event.dataTransfer.files;
    for (var i = 0; i < files.length ; i++) {
      var file = files[i];
      var isImage = file.type.indexOf('image') === 0;
      var isPiskel = /\.piskel$/i.test(file.name);
      var isPalette = /\.(gpl|txt|pal)$/i.test(file.name);
      if (isImage) {
        this.readImageFile_(file);
      } else if (isPiskel) {
        pskl.utils.PiskelFileUtils.loadFromFile(file, this.onPiskelFileLoaded_);
      } else if (isPalette) {
        pskl.app.paletteImportService.read(file, this.onPaletteLoaded_.bind(this));
      }
    }
  };

  ns.FileDropperService.prototype.readImageFile_ = function (imageFile) {
    pskl.utils.FileUtils.readFile(imageFile, this.processImageSource_.bind(this));
  };

  ns.FileDropperService.prototype.onPaletteLoaded_ = function (palette) {
    pskl.app.paletteService.savePalette(palette);
    pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, palette.id);
  };

  ns.FileDropperService.prototype.onPiskelFileLoaded_ = function (piskel, descriptor, fps) {
    if (window.confirm('This will replace your current animation')) {
      piskel.setDescriptor(descriptor);
      pskl.app.piskelController.setPiskel(piskel);
      pskl.app.animationController.setFPS(fps);
    }
  };

  ns.FileDropperService.prototype.processImageSource_ = function (imageSource) {
    this.importedImage_ = new Image();
    this.importedImage_.onload = this.onImageLoaded_.bind(this);
    this.importedImage_.src = imageSource;
  };

  ns.FileDropperService.prototype.onImageLoaded_ = function () {
    var droppedFrame = pskl.utils.FrameUtils.createFromImage(this.importedImage_);
    var currentFrame = this.piskelController.getCurrentFrame();

    var dropCoordinates = this.adjustDropPosition_(this.dropPosition_, droppedFrame);

    currentFrame.forEachPixel(function (color, x, y) {
      var fColor = droppedFrame.getPixel(x-dropCoordinates.x, y-dropCoordinates.y);
      if (fColor && fColor != Constants.TRANSPARENT_COLOR) {
        currentFrame.setPixel(x, y, fColor);
      }
    });

    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };

  ns.FileDropperService.prototype.adjustDropPosition_ = function (position, droppedFrame) {
    var framePosition = pskl.app.drawingController.getSpriteCoordinates(position.x, position.y);

    var xCoord = framePosition.x - Math.floor(droppedFrame.width/2);
    var yCoord = framePosition.y - Math.floor(droppedFrame.height/2);

    xCoord = Math.max(0, xCoord);
    yCoord = Math.max(0, yCoord);

    var currentFrame = this.piskelController.getCurrentFrame();
    if (droppedFrame.width <= currentFrame.width) {
      xCoord = Math.min(xCoord, currentFrame.width - droppedFrame.width);
    }

    if (droppedFrame.height <= currentFrame.height) {
      yCoord = Math.min(yCoord, currentFrame.height - droppedFrame.height);
    }

    return {
      x : xCoord,
      y : yCoord
    };
  };

})();