/* @file Image and Animation import service supporting the import dialog. */
(function () {
  var ns = $.namespace('pskl.service');
  /**
   * Image an animation import service supporting the import dialog.
   * @param {!PiskelController} piskelController
   * @param {!PreviewController} previewController
   * @constructor
   */
  ns.ImportService =
      function (piskelController, previewController) {
    this.piskelController_ = piskelController;
    this.previewController_ = previewController;
  };

  /**
   * Given an image object and some options, create a new Piskel and open it
   * for editing.
   * @param {!Image} image
   * @param {!Object} options
   * @param {!string} options.importType - 'single' if not spritesheet
   * @param {!number} options.frameSizeX
   * @param {!number} options.frameSizeY
   * @param {number} [options.frameOffsetX] only used in spritesheet imports.
   * @param {number} [options.frameOffsetY] only used in spritesheet imports.
   * @param {!boolean} options.smoothing
   * @param {function} [onComplete]
   */
  ns.ImportService.prototype.newPiskelFromImage = function (image, options, onComplete) {
    onComplete = onComplete || Constants.EMPTY_FUNCTION;
    var importType = options.importType;
    var frameSizeX = options.frameSizeX;
    var frameSizeY = options.frameSizeY;
    var frameOffsetX = options.frameOffsetX;
    var frameOffsetY = options.frameOffsetY;

    var gifLoader = new window.SuperGif({
      gif: image
    });

    gifLoader.load({
      success: function () {
        var images = gifLoader.getFrames().map(function (frame) {
          return pskl.utils.CanvasUtils.createFromImageData(frame.data);
        });

        if (importType === 'single' || images.length > 1) {
          // Single image import or animated gif
          this.createPiskelFromImages_(images, frameSizeX, frameSizeY, options.smoothing);
        } else {
          // Spritesheet
          var frameImages = this.createImagesFromSheet_(images[0]);
          this.createPiskelFromImages_(frameImages, frameSizeX, frameSizeY, options.smoothing);
        }
        onComplete();
      }.bind(this),
      error: function () {
        if (importType === 'single') {
          // Single image
          this.createPiskelFromImages_([image], frameSizeX, frameSizeY, options.smoothing);
        } else {
          // Spritesheet
          var frameImages = this.createImagesFromSheet_(image, frameSizeX, frameSizeY, frameOffsetX, frameOffsetY);
          this.createPiskelFromImages_(frameImages, frameSizeX, frameSizeY, options.smoothing);
        }
        onComplete();
      }.bind(this)
    });
  };

  /**
   * @param {!Image} image
   * @param {!number} frameSizeX
   * @param {!number} frameSizeY
   * @param {!number} frameOffsetX
   * @param {!number} frameOffsetY
   * @returns {canvas[]}
   * @private
   */
  ns.ImportService.prototype.createImagesFromSheet_ = function (image,
      frameSizeX, frameSizeY, frameOffsetX, frameOffsetY) {
    return pskl.utils.CanvasUtils.createFramesFromImage(
        image,
        frameOffsetX,
        frameOffsetY,
        frameSizeX,
        frameSizeY,
        /*useHorizonalStrips=*/ true,
        /*ignoreEmptyFrames=*/ true);
  };

  /**
   * @param {canvas[]} images
   * @param {!number} frameSizeX
   * @param {!number} frameSizeY
   * @param {!boolean} smoothing
   * @private
   */
  ns.ImportService.prototype.createPiskelFromImages_ = function (images,
      frameSizeX, frameSizeY, smoothing) {
    var frames = this.createFramesFromImages_(images, frameSizeX, frameSizeY, smoothing);
    var layer = pskl.model.Layer.fromFrames('Layer 1', frames);
    var descriptor = new pskl.model.piskel.Descriptor('Imported piskel', '');
    var piskel = pskl.model.Piskel.fromLayers([layer], descriptor);

    this.piskelController_.setPiskel(piskel);
    this.previewController_.setFPS(Constants.DEFAULT.FPS);
  };

  /**
   * @param {!canvas[]} images
   * @param {!number} frameSizeX
   * @param {!number} frameSizeY
   * @param {!boolean} smoothing
   * @returns {pskl.model.Frame[]}
   * @private
   */
  ns.ImportService.prototype.createFramesFromImages_ = function (images, frameSizeX, frameSizeY, smoothing) {
    return images.map(function (image) {
      var resizedImage = pskl.utils.ImageResizer.resize(image, frameSizeX, frameSizeY, smoothing);
      return pskl.utils.FrameUtils.createFromImage(resizedImage);
    });
  };
})();
