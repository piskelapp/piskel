(function () {
  var ns = $.namespace('pskl.controller.dialogs');
  var PREVIEW_HEIGHT = 60;

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

    this.resizeWidth = $('[name=resize-width]');
    this.resizeHeight = $('[name=resize-height]');
    this.smoothResize = $('[name=smooth-resize-checkbox]');

    this.frameCountX = $('[name=frame-count-x]');
    this.frameCountY = $('[name=frame-count-y]');

    this.resizeWidth.keyup(this.onResizeInputKeyUp_.bind(this, 'width'));
    this.resizeHeight.keyup(this.onResizeInputKeyUp_.bind(this, 'height'));
    this.frameCountX.keyup(this.onResizeInputKeyUp_.bind(this, 'frameCountX'));
    this.frameCountY.keyup(this.onResizeInputKeyUp_.bind(this, 'frameCountY'));

    this.importImageForm = $('[name=import-image-form]');
    this.importImageForm.submit(this.onImportFormSubmit_.bind(this));

    pskl.utils.FileUtils.readImageFile(this.file_, this.onImageLoaded_.bind(this));
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

  ns.ImportImageController.prototype.synchronizeResizeFields_ = function (value, from) {
    value = parseInt(value, 10);
    if (isNaN(value)) {
      value = 0;
    }
    var height = this.importedImage_.height;
    var width = this.importedImage_.width;

    var frameCountX = parseInt(this.frameCountX.val(), 10);
    if (frameCountX <= 0 || isNaN(frameCountX)) {
      this.frameCountX.val(1);
      frameCountX = 1;
    }

    var frameCountY = parseInt(this.frameCountY.val(), 10);
    if (frameCountY <= 0 || isNaN(frameCountY)) {
      this.frameCountY.val(1);
      frameCountY = 1;
    }

    if (from === 'frameCountX' || from === 'frameCountY') {
      this.resizeWidth.val(Math.round(width / frameCountX));
      this.resizeHeight.val(Math.round(height / frameCountY));
      this.drawFramesGrid_();
    } else if (from === 'width') {
      this.resizeHeight.val(Math.round(value * height / width));
    } else {
      this.resizeWidth.val(Math.round(value * width / height));
    }
  };

  ns.ImportImageController.prototype.onImageLoaded_ = function (image) {
    this.importedImage_ = image;

    var w = this.importedImage_.width;
    var h = this.importedImage_.height;

    // FIXME : We remove the onload callback here because JsGif will insert
    // the image again and we want to avoid retriggering the image onload
    this.importedImage_.onload = function () { };

    var fileName = this.extractFileNameFromPath_(this.file_.name);
    this.fileNameContainer.html(fileName);

    this.resizeWidth.val(w);
    this.resizeHeight.val(h);

    this.frameCountX.val(1);
    this.frameCountY.val(1);

    this.importPreview.width('auto');
    this.importPreview.html('');
    this.importPreview.append(this.createImagePreview_());
  };

  ns.ImportImageController.prototype.createImagePreview_ = function () {
    var image = document.createElement('IMG');
    image.src = this.importedImage_.src;
    image.setAttribute('height', PREVIEW_HEIGHT);
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
    var image = this.importedImage_;
    if (image) {
      if (window.confirm('You are about to create a new Piskel, unsaved changes will be lost.')) {
        var gifLoader = new window.SuperGif({
          gif: image
        });

        gifLoader.load({
          success: function () {
            var images = gifLoader.getFrames().map(function (frame) {
              return pskl.utils.CanvasUtils.createFromImageData(frame.data);
            });
            this.createPiskelFromImages_(images);
            this.closeDialog();
          }.bind(this),
          error: function () {
            var images = pskl.utils.CanvasUtils.createFramesFromImage(
              image,
              this.frameCountX.val(),
              this.frameCountY.val());
            this.createPiskelFromImages_(images);
            this.closeDialog();
          }.bind(this)
        });

      }
    }
  };

  ns.ImportImageController.prototype.createFramesFromImages_ = function (images) {
    var w = this.resizeWidth.val();
    var h = this.resizeHeight.val();
    var smoothing = !!this.smoothResize.prop('checked');

    var frames = images.map(function (image) {
      var resizedImage = pskl.utils.ImageResizer.resize(image, w, h, smoothing);
      return pskl.utils.FrameUtils.createFromImage(resizedImage);
    });
    return frames;
  };

  ns.ImportImageController.prototype.createPiskelFromImages_ = function (images) {
    var frames = this.createFramesFromImages_(images);
    var layer = pskl.model.Layer.fromFrames('Layer 1', frames);
    var descriptor = new pskl.model.piskel.Descriptor('Imported piskel', '');
    var piskel = pskl.model.Piskel.fromLayers([layer], descriptor);

    pskl.app.piskelController.setPiskel(piskel);
    pskl.app.previewController.setFPS(Constants.DEFAULT.FPS);
  };

  ns.ImportImageController.prototype.drawFramesGrid_ = function () {
    var canvasWrapper = this.importPreview.children('canvas');
    var countX = this.frameCountX.val();
    var countY = this.frameCountY.val();
    if (countX > 1 || countY > 1) {
      var width = this.importedImage_.width;
      var height = this.importedImage_.height;
      var frameW = width / countX;
      var frameH = height / countY;

      var canvas = canvasWrapper.get(0);
      if (!canvasWrapper.length) {
        // Create a new canvas for the grid
        canvas = pskl.utils.CanvasUtils.createCanvas(width + 1, height + 1);
        this.importPreview.append(canvas);
        canvasWrapper = $(canvas);
      }

      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();

      // Draw the vertical lines
      for (var x = 0.5; x < width + 1; x += frameW) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }

      // Draw the horizontal lines
      for (var y = 0.5; y < height + 1; y += frameH) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }

      // Set the line style to dashed
      context.lineWidth = 1;
      context.setLineDash([2, 1]);
      context.strokeStyle = '#000000';
      context.stroke();

      // Resize the canvas so that it matches the preview height and stretches correctly
      canvasWrapper.height(PREVIEW_HEIGHT + 1);
      canvasWrapper.show();
      this.importPreview.addClass('no-border');
    } else {
      canvasWrapper.hide();
      this.importPreview.removeClass('no-border');
    }
  };
})();
