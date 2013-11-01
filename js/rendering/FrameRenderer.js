(function () {
  var ns = $.namespace("pskl.rendering");

  /**
   * FrameRenderer will display a given frame inside a canvas element.
   * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
   * @param {Object} renderingOptions
   * @param {Array} classes array of strings to use for css classes
   */
  ns.FrameRenderer = function (container, renderingOptions, classes) {
    this.defaultRenderingOptions = {
      'supportGridRendering' : false,
      'zoom' : 1
    };

    renderingOptions = $.extend(true, {}, this.defaultRenderingOptions, renderingOptions);

    if(container === undefined) {
      throw 'Bad FrameRenderer initialization. <container> undefined.';
    }

    if(isNaN(renderingOptions.zoom)) {
      throw 'Bad FrameRenderer initialization. <zoom> not well defined.';
    }

    this.container = container;

    this.zoom = renderingOptions.zoom;

    this.frameOffsetX = 0;
    this.frameOffsetY = 0;

    this.marginY = 0;
    this.marginX = 0;

    this.supportGridRendering = renderingOptions.supportGridRendering;

    this.classes = classes || [];
    this.classes.push('canvas');

    /**
     * Off dom canvas, will be used to draw the frame at 1:1 ratio
     * @type {HTMLElement}
     */
    this.canvas = null;

    /**
     * Displayed canvas, scaled-up from the offdom canvas
     * @type {HTMLElement}
     */
    this.displayCanvas = null;
    this.setDisplaySize(renderingOptions.width, renderingOptions.height);

    this.enableGrid(pskl.UserSettings.get(pskl.UserSettings.SHOW_GRID));

    this.updateBackgroundClass_(pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
  };

  ns.FrameRenderer.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
  };

  ns.FrameRenderer.prototype.isAutoSized_ = function () {
    return this.displayHeight === 'auto' && this.displayWidth === 'auto';
  };

  ns.FrameRenderer.prototype.setDisplaySize = function (width, height) {
    this.displayHeight = height;
    this.displayWidth = width;
    if (this.displayCanvas) {
      $(this.displayCanvas).remove();
      this.displayCanvas = null;
    }
  };

  ns.FrameRenderer.prototype.updateMargins_ = function () {
    if (!this.isAutoSized_()) {
      var deltaX = this.displayWidth - (this.zoom * this.canvas.width);
      this.marginX = Math.max(0, deltaX) / 2;

      var deltaY = this.displayHeight - (this.zoom * this.canvas.height);
      this.marginY = Math.max(0, deltaY) / 2;
    }
  };

  ns.FrameRenderer.prototype.createDisplayCanvas_ = function () {
    var height = this.displayHeight;
    var width = this.displayWidth;

    if (this.isAutoSized_()) {
      height = this.zoom * this.canvas.height;
      width = this.zoom * this.canvas.width;
    }

    this.displayCanvas = pskl.CanvasUtils.createCanvas(width, height, this.classes);
    if (true || this.zoom > 2) {
      pskl.CanvasUtils.disableImageSmoothing(this.displayCanvas);
    }
    this.container.append(this.displayCanvas);
  };

  ns.FrameRenderer.prototype.setDisplayOffset = function (frameOffsetX, frameOffsetY) {
    this.frameOffsetX = frameOffsetX;
    this.frameOffsetY = frameOffsetY;
  };

  ns.FrameRenderer.prototype.moveOffset = function (frameOffsetX, frameOffsetY) {
    this.setDisplayOffset(this.frameOffsetX + frameOffsetX, this.frameOffsetY + frameOffsetY);
  };

  /**
   * @private
   */
  ns.FrameRenderer.prototype.onUserSettingsChange_ = function (evt, settingName, settingValue) {
    if(settingName == pskl.UserSettings.SHOW_GRID) {
      this.enableGrid(settingValue);
    }
    else if (settingName == pskl.UserSettings.CANVAS_BACKGROUND) {
      this.updateBackgroundClass_(settingValue);
    }
  };

  /**
   * @private
   */
  ns.FrameRenderer.prototype.updateBackgroundClass_ = function (newClass) {
    var currentClass = this.container.data('current-background-class');
    if (currentClass) {
      this.container.removeClass(currentClass);
    }
    this.container.addClass(newClass);
    this.container.data('current-background-class', newClass);
  };

  ns.FrameRenderer.prototype.enableGrid = function (flag) {
    this.gridStrokeWidth = (flag && this.supportGridRendering) ? Constants.GRID_STROKE_WIDTH : 0;
    this.canvasConfigDirty = true;
  };

  ns.FrameRenderer.prototype.render = function (frame) {
    if (frame) {
      this.clear();
      this.renderFrame_(frame);
    }
  };

  ns.FrameRenderer.prototype.clear = function () {
    pskl.CanvasUtils.clear(this.canvas);
    pskl.CanvasUtils.clear(this.displayCanvas);
  };

  ns.FrameRenderer.prototype.renderPixel_ = function (color, col, row, context) {
    if(color != Constants.TRANSPARENT_COLOR) {
      context.fillStyle = color;
      context.fillRect(col, row, 1, 1);
    }
  };

  /**
   * Transform a screen pixel-based coordinate (relative to the top-left corner of the rendered
   * frame) into a sprite coordinate in column and row.
   * @public
   */
  ns.FrameRenderer.prototype.convertPixelCoordinatesIntoSpriteCoordinate = function(coords) {
    var cellSize = this.zoom + this.gridStrokeWidth;
    var xCoord = (coords.x - this.marginX) + (this.frameOffsetX * cellSize),
        yCoord = (coords.y - this.marginY)  + (this.frameOffsetY * cellSize);
    return {
      "col" : (xCoord - xCoord % cellSize) / cellSize,
      "row" : (yCoord - yCoord % cellSize) / cellSize
    };
  };

  /**
   * @private
   */
  ns.FrameRenderer.prototype.getFramePos_ = function(index) {
    return index * this.dpi + ((index - 1) * this.gridStrokeWidth);
  };

  /**
   * @private
   */
  ns.FrameRenderer.prototype.renderFrame_ = function (frame) {
    if (!this.canvas) {
      this.canvas = pskl.CanvasUtils.createCanvas(frame.getWidth(), frame.getHeight());
    }

    var context = this.canvas.getContext('2d');
    for(var col = 0, width = frame.getWidth(); col < width; col++) {
      for(var row = 0, height = frame.getHeight(); row < height; row++) {
        var color = frame.getPixel(col, row);
        this.renderPixel_(color, col, row, context);
      }
    }

    if (!this.displayCanvas) {
      this.createDisplayCanvas_();
    }

    this.updateMargins_();

    context = this.displayCanvas.getContext('2d');
    context.save();
    // zoom < 1
    context.fillStyle = "#aaa";
    // zoom < 1
    context.fillRect(0,0,this.displayCanvas.width, this.displayCanvas.height);
    context.translate(this.marginX, this.marginY);
    context.scale(this.zoom, this.zoom);
    context.translate(-this.frameOffsetX, -this.frameOffsetY);
    // zoom < 1
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.drawImage(this.canvas, 0, 0);
    context.restore();
  };
})();