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
      'supportGridRendering' : false
    };
    renderingOptions = $.extend(true, {}, this.defaultRenderingOptions, renderingOptions);

    if(container === undefined) {
      throw 'Bad FrameRenderer initialization. <container> undefined.';
    }

    if(isNaN(renderingOptions.dpi)) {
      throw 'Bad FrameRenderer initialization. <dpi> not well defined.';
    }

    this.container = container;

    this.dpi = renderingOptions.dpi;
    this.supportGridRendering = renderingOptions.supportGridRendering;

    this.classes = classes || [];
    this.classes.push('canvas');

    this.canvas = null;

    this.enableGrid(pskl.UserSettings.get(pskl.UserSettings.SHOW_GRID));

    // Flag to know if the config was altered
    this.canvasConfigDirty = true;
    this.updateBackgroundClass_(pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
  };

  ns.FrameRenderer.prototype.setDPI = function (dpi) {
    this.dpi = dpi;
    this.canvasConfigDirty = true;
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
      var context = this.getCanvas_(frame).getContext('2d');
      for(var col = 0, width = frame.getWidth(); col < width; col++) {
        for(var row = 0, height = frame.getHeight(); row < height; row++) {
          var color = frame.getPixel(col, row);
          this.renderPixel_(color, col, row, context);
        }
      }
      this.lastRenderedFrame = frame;
    }
  };

  ns.FrameRenderer.prototype.renderPixel_ = function (color, col, row, context) {
    if(color != Constants.TRANSPARENT_COLOR) {
      context.fillStyle = color;
      context.fillRect(this.getFramePos_(col), this.getFramePos_(row), this.dpi, this.dpi);
    }
  };

  ns.FrameRenderer.prototype.clear = function () {
    if (this.canvas) {
      this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };

  /**
   * Transform a screen pixel-based coordinate (relative to the top-left corner of the rendered
   * frame) into a sprite coordinate in column and row.
   * @public
   */
  ns.FrameRenderer.prototype.convertPixelCoordinatesIntoSpriteCoordinate = function(coords) {
    var cellSize = this.dpi + this.gridStrokeWidth;
    return {
      "col" : (coords.x - coords.x % cellSize) / cellSize,
      "row" : (coords.y - coords.y % cellSize) / cellSize
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
  ns.FrameRenderer.prototype.getCanvas_ = function (frame) {
    if(this.canvasConfigDirty) {
      $(this.canvas).remove();

      var col = frame.getWidth(),
        row = frame.getHeight();

      var pixelWidth =  col * this.dpi + this.gridStrokeWidth * (col - 1);
      var pixelHeight =  row * this.dpi + this.gridStrokeWidth * (row - 1);

      var canvas = pskl.CanvasUtils.createCanvas(pixelWidth, pixelHeight, this.classes);
      this.container.append(canvas);

      this.canvas = canvas;
      this.canvasConfigDirty = false;
    }
    return this.canvas;
  };
})();