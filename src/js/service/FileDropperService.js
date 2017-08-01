(function () {
  var ns = $.namespace('pskl.service');

  ns.FileDropperService = function (piskelController) {
    this.piskelController = piskelController;
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
    this.isMultipleFiles_ = (files.length > 1);

    for (var i = 0; i < files.length ; i++) {
      var file = files[i];
      var isImage = file.type.indexOf('image') === 0;
      var isPiskel = /\.piskel$/i.test(file.name);
      var isPalette = /\.(gpl|txt|pal)$/i.test(file.name);
      if (isImage) {
        pskl.utils.FileUtils.readImageFile(file, function (image) {
          this.onImageLoaded_(image, file);
        }.bind(this));
      } else if (isPiskel) {
        pskl.utils.PiskelFileUtils.loadFromFile(file, this.onPiskelFileLoaded_, this.onPiskelFileError_);
      } else if (isPalette) {
        pskl.app.paletteImportService.read(file, this.onPaletteLoaded_.bind(this));
      }
    }
  };

  ns.FileDropperService.prototype.onPaletteLoaded_ = function (palette) {
    pskl.app.paletteService.savePalette(palette);
    pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, palette.id);
  };

  ns.FileDropperService.prototype.onPiskelFileLoaded_ = function (piskel) {
    if (window.confirm(Constants.CONFIRM_OVERWRITE)) {
      pskl.app.piskelController.setPiskel(piskel);
    }
  };

  ns.FileDropperService.prototype.onPiskelFileError_ = function (reason) {
    $.publish(Events.PISKEL_FILE_IMPORT_FAILED, [reason]);
  };

  ns.FileDropperService.prototype.onImageLoaded_ = function (importedImage, file) {
    var piskelWidth = pskl.app.piskelController.getWidth();
    var piskelHeight = pskl.app.piskelController.getHeight();

    if (this.isMultipleFiles_) {
      this.piskelController.addFrameAtCurrentIndex();
      this.piskelController.selectNextFrame();
    } else if (importedImage.width > piskelWidth || importedImage.height > piskelHeight) {
      // For single file imports, if the file is too big, trigger the import wizard.
      $.publish(Events.DIALOG_SHOW, {
        dialogId : 'import',
        initArgs : {
          rawFiles: [file]
        }
      });

      return;
    }

    var currentFrame = this.piskelController.getCurrentFrame();
    // Convert client coordinates to sprite coordinates
    var spriteDropPosition = pskl.app.drawingController.getSpriteCoordinates(
      this.dropPosition_.x,
      this.dropPosition_.y
    );

    var x = spriteDropPosition.x;
    var y = spriteDropPosition.y;

    pskl.utils.FrameUtils.addImageToFrame(currentFrame, importedImage, x, y);

    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };

})();
