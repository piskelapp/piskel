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

    var files = Array.from(event.dataTransfer.files);
    this.isMultipleFiles_ = (files.length > 1);
    const loadedOrder = [];
    const lastFrameIndex = this.piskelController.getCurrentFrameIndex();

    for (let i = 0; i < files.length ; i++) {
      let file = files[i];
      const isImage = file.type.indexOf('image') === 0;
      const isPiskel = /\.piskel$/i.test(file.name);
      const isPalette = /\.(gpl|txt|pal)$/i.test(file.name);
      if (isImage) {
        pskl.utils.FileUtils.readImageFile(file, function (image) {
          // keep it drag-drop order
          loadedOrder.push(i);
          this.onImageLoaded_(image, file);

          if (loadedOrder.length === files.length)
            if(this.isMultipleFiles_) {
              this.resortImportOrders_(lastFrameIndex, loadedOrder);
            }
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

  /**
   * Resort imported images to the dragged order
   * 
   * @param {number} startIndex ordered index
   * @param {number[]} order insert order. start from 0
   */
  ns.FileDropperService.prototype.resortImportOrders_ = function (startIndex, order) {
    const indexedOrder = order.map((o) => o + startIndex + 1);
    const sorted = [...indexedOrder].sort((a, b) => a - b);

    let currentPositions = new Map();
    for (let i = 0; i < indexedOrder.length; i++) {
      currentPositions.set(indexedOrder[i], startIndex + 1 + i);
    }

    for (let targetIdx = 0; targetIdx < sorted.length; targetIdx++) {
      const targetValue = sorted[targetIdx];
      const targetAbsolutePos = startIndex + 1 + targetIdx;

      const currentPos = currentPositions.get(targetValue);

      if (currentPos === targetAbsolutePos)
        continue;

      this.piskelController.moveFrame(currentPos, targetAbsolutePos);

      // update others location
      if (currentPos < targetAbsolutePos) {
        for (let [value, pos] of currentPositions) {
          if (pos > currentPos && pos <= targetAbsolutePos) {
            currentPositions.set(value, pos - 1);
          }
        }
      } else {
        for (let [value, pos] of currentPositions) {
          if (pos >= targetAbsolutePos && pos < currentPos) {
            currentPositions.set(value, pos + 1);
          }
        }
      }

      currentPositions.set(targetValue, targetAbsolutePos);
    }
  }
})();
