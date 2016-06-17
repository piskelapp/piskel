(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.ImportImageController = function (piskelController) {
    this.importedImage_ = null;
    this.file_ = null;
  };

  pskl.utils.inherit(ns.ImportImageController, ns.AbstractDialogController);

  ns.ImportImageController.prototype.init = function (file) {
    this.superclass.init.call(this);

    this.file_ = file;

    this.importPreview = $('.import-section-preview');

    this.fileNameContainer = $('.import-image-file-name');

    this.importType = $('[name=import-type]');

    this.resizeWidth = $('[name=resize-width]');
    this.resizeHeight = $('[name=resize-height]');
    this.smoothResize =  $('[name=smooth-resize-checkbox]');

    this.frameSizeX = $('[name=frame-size-x]');
    this.frameSizeY = $('[name=frame-size-y]');
    this.frameOffsetX = $('[name=frame-offset-x]');
    this.frameOffsetY = $('[name=frame-offset-y]');

    this.importType.change(this.onImportTypeChange_.bind(this));

    this.resizeWidth.keyup(this.onResizeInputKeyUp_.bind(this, 'width'));
    this.resizeHeight.keyup(this.onResizeInputKeyUp_.bind(this, 'height'));
    this.frameSizeX.keyup(this.onFrameInputKeyUp_.bind(this, 'frameSizeX'));
    this.frameSizeY.keyup(this.onFrameInputKeyUp_.bind(this, 'frameSizeY'));
    this.frameOffsetX.keyup(this.onFrameInputKeyUp_.bind(this, 'frameOffsetX'));
    this.frameOffsetY.keyup(this.onFrameInputKeyUp_.bind(this, 'frameOffsetY'));

    this.importImageForm = $('[name=import-image-form]');
    this.importImageForm.submit(this.onImportFormSubmit_.bind(this));

    pskl.utils.FileUtils.readImageFile(this.file_, this.onImageLoaded_.bind(this));
  };

  ns.ImportImageController.prototype.onImportTypeChange_ = function (evt) {
    if (this.getImportType_() === 'single') {
      // Using single image, so remove the frame grid
      this.hideFrameGrid_();
    } else {
      // Using spritesheet import, so draw the frame grid in the preview
      var x = this.sanitizeInputValue_(this.frameOffsetX, 0);
      var y = this.sanitizeInputValue_(this.frameOffsetY, 0);
      var w = this.sanitizeInputValue_(this.frameSizeX, 1);
      var h = this.sanitizeInputValue_(this.frameSizeY, 1);
      this.drawFrameGrid_(x, y, w, h);
    }
  };

  ns.ImportImageController.prototype.onImportFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    this.importImageToPiskel_();
  };

  ns.ImportImageController.prototype.onResizeInputKeyUp_ = function (from, evt) {
    if (this.importedImage_) {
      this.synchronizeResizeFields_(evt.target.value, from);
    }
  };

  ns.ImportImageController.prototype.onFrameInputKeyUp_ = function (from, evt) {
    if (this.importedImage_) {
      this.synchronizeFrameFields_(evt.target.value, from);
    }
  };

  ns.ImportImageController.prototype.synchronizeResizeFields_ = function (value, from) {
    value = parseInt(value, 10);
    if (isNaN(value)) {
      value = 0;
    }
    var height = this.importedImage_.height;
    var width = this.importedImage_.width;

    // Select single image import type since the user changed a value here
    this.importType.filter('[value="single"]').attr('checked', 'checked');

    if (from === 'width') {
      this.resizeHeight.val(Math.round(value * height / width));
    } else {
      this.resizeWidth.val(Math.round(value * width / height));
    }
  };

  ns.ImportImageController.prototype.synchronizeFrameFields_ = function (value, from) {
    value = parseInt(value, 10);
    if (isNaN(value)) {
      value = 0;
    }

    // Parse the frame input values
    var frameSizeX = this.sanitizeInputValue_(this.frameSizeX, 1);
    var frameSizeY = this.sanitizeInputValue_(this.frameSizeY, 1);
    var frameOffsetX = this.sanitizeInputValue_(this.frameOffsetX, 0);
    var frameOffsetY = this.sanitizeInputValue_(this.frameOffsetY, 0);

    // Select spritesheet import type since the user changed a value here
    this.importType.filter('[value="sheet"]').attr('checked', 'checked');

    // Draw the grid
    this.drawFrameGrid_(frameOffsetX, frameOffsetY, frameSizeX, frameSizeY);
  };

  ns.ImportImageController.prototype.sanitizeInputValue_ = function(input, minValue) {
    var value = parseInt(input.val(), 10);
    if (value <= minValue || isNaN(value)) {
      input.val(minValue);
      value = minValue;
    }
    return value;
  };

  ns.ImportImageController.prototype.getImportType_ = function () {
    return this.importType.filter(':checked').val();
  };

  ns.ImportImageController.prototype.onImageLoaded_ = function (image) {
    this.importedImage_ = image;

    var w = this.importedImage_.width;
    var h = this.importedImage_.height;

    // FIXME : We remove the onload callback here because JsGif will insert
    // the image again and we want to avoid retriggering the image onload
    this.importedImage_.onload = function () {};

    var fileName = this.extractFileNameFromPath_(this.file_.name);
    this.fileNameContainer.html(fileName);
    this.fileNameContainer.attr('title', fileName);

    this.resizeWidth.val(w);
    this.resizeHeight.val(h);

    this.frameSizeX.val(w);
    this.frameSizeY.val(h);
    this.frameOffsetX.val(0);
    this.frameOffsetY.val(0);

    this.importPreview.width('auto');
    this.importPreview.height('auto');
    this.importPreview.html('');
    this.importPreview.append(this.createImagePreview_());
  };

  ns.ImportImageController.prototype.createImagePreview_ = function () {
    var image = document.createElement('IMG');
    image.src = this.importedImage_.src;
    return image;
  };

  ns.ImportImageController.prototype.extractFileNameFromPath_ = function (path) {
    var parts = [];
    if (path.indexOf('/') !== -1) {
      parts = path.split('/');
    } else if (path.indexOf('\\') !== -1) {
      parts = path.split('\\');
    } else {
      parts = [path];
    }
    return parts[parts.length - 1];
  };

  ns.ImportImageController.prototype.importImageToPiskel_ = function () {
    if (this.importedImage_) {
      if (window.confirm('You are about to create a new Piskel, unsaved changes will be lost.')) {
        pskl.app.importService.newPiskelFromImage(
          this.importedImage_,
          {
            importType: this.getImportType_(),
            frameSizeX: this.getImportType_() === 'single' ?
                this.resizeWidth.val() : this.sanitizeInputValue_(this.frameSizeX, 1),
            frameSizeY: this.getImportType_() === 'single' ?
                this.resizeHeight.val() : this.sanitizeInputValue_(this.frameSizeY, 1),
            frameOffsetX: this.sanitizeInputValue_(this.frameOffsetX, 0),
            frameOffsetY: this.sanitizeInputValue_(this.frameOffsetY, 0),
            smoothing: !!this.smoothResize.prop('checked')
          },
          this.closeDialog.bind(this)
        );
      }
    }
  };

  ns.ImportImageController.prototype.drawFrameGrid_ = function (frameX, frameY, frameW, frameH) {
    if (!this.importedImage_) {
      return;
    }

    // Grab the sizes of the source and preview images
    var width = this.importedImage_.width;
    var height = this.importedImage_.height;
    var previewWidth = this.importPreview.width();
    var previewHeight = this.importPreview.height();

    var canvasWrapper = this.importPreview.children('canvas');
    var canvas = canvasWrapper.get(0);
    if (!canvasWrapper.length) {
      // Create a new canvas for the grid
      canvas = pskl.utils.CanvasUtils.createCanvas(
        previewWidth + 1,
        previewHeight + 1);
      this.importPreview.append(canvas);
      canvasWrapper = $(canvas);
    }

    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    // Calculate the number of whole frames
    var countX = Math.floor((width - frameX) / frameW);
    var countY = Math.floor((height - frameY) / frameH);

    if (countX > 0 && countY > 0) {
      var scaleX = previewWidth / width;
      var scaleY = previewHeight / height;
      var maxWidth = countX * frameW + frameX;
      var maxHeight = countY * frameH + frameY;

      // Draw the vertical lines
      for (var x = frameX + 0.5; x < maxWidth + 1 && x < width + 1; x += frameW) {
        context.moveTo(x * scaleX, frameY * scaleY);
        context.lineTo(x * scaleX, maxHeight * scaleY);
      }

      // Draw the horizontal lines
      for (var y = frameY + 0.5; y < maxHeight + 1 && y < height + 1; y += frameH) {
        context.moveTo(frameX * scaleX, y * scaleY);
        context.lineTo(maxWidth * scaleX, y * scaleY);
      }

      // Set the line style to dashed
      context.lineWidth = 1;
      context.setLineDash([2, 1]);
      context.strokeStyle = '#000000';
      context.stroke();

      // Show the canvas
      canvasWrapper.show();
      this.importPreview.addClass('no-border');
    } else {
      this.hideFrameGrid_();
    }
  };

  ns.ImportImageController.prototype.hideFrameGrid_ = function() {
    this.importPreview.children('canvas').hide();
    this.importPreview.removeClass('no-border');
  };

})();
