(function () {
  var ns = $.namespace("pskl.rendering.frame");

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

    this.offset = {
      x : 0,
      y : 0
    };

    this.margin = {
      x : 0,
      y : 0
    };

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

    this.setGridEnabled(pskl.UserSettings.get(pskl.UserSettings.SHOW_GRID));

    this.updateBackgroundClass_(pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
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

  ns.FrameRenderer.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
  };

  ns.FrameRenderer.prototype.getZoom = function () {
    return this.zoom;
  };

  ns.FrameRenderer.prototype.setDisplaySize = function (width, height) {
    this.displayWidth = width;
    this.displayHeight = height;
    if (this.displayCanvas) {
      $(this.displayCanvas).remove();
      this.displayCanvas = null;
    }
    this.createDisplayCanvas_();
  };

  ns.FrameRenderer.prototype.getDisplaySize = function () {
    return {
      height : this.displayHeight,
      width : this.displayWidth
    };
  };

  ns.FrameRenderer.prototype.getOffset = function () {
    return {
      x : this.offset.x,
      y : this.offset.y
    };
  },

  ns.FrameRenderer.prototype.moveOffset = function (x, y) {
    this.setOffset_(this.offset.x + x, this.offset.y + y);
  };

  ns.FrameRenderer.prototype.setGridEnabled = function (flag) {
    this.gridStrokeWidth = (flag && this.supportGridRendering) ? Constants.GRID_STROKE_WIDTH : 0;
    this.canvasConfigDirty = true;
  };

  ns.FrameRenderer.prototype.updateMargins_ = function () {
    var deltaX = this.displayWidth - (this.zoom * this.canvas.width);
    this.margin.x = Math.max(0, deltaX) / 2;

    var deltaY = this.displayHeight - (this.zoom * this.canvas.height);
    this.margin.y = Math.max(0, deltaY) / 2;
  };

  ns.FrameRenderer.prototype.createDisplayCanvas_ = function () {
    var height = this.displayHeight;
    var width = this.displayWidth;

    this.displayCanvas = pskl.CanvasUtils.createCanvas(width, height, this.classes);
    if (true || this.zoom > 2) {
      pskl.CanvasUtils.disableImageSmoothing(this.displayCanvas);
    }
    this.container.append(this.displayCanvas);
  };

  ns.FrameRenderer.prototype.setOffset_ = function (x, y) {
    this.offset.x = x;
    this.offset.y = y;
  };

  ns.FrameRenderer.prototype.onUserSettingsChange_ = function (evt, settingName, settingValue) {
    if(settingName == pskl.UserSettings.SHOW_GRID) {
      this.setGridEnabled(settingValue);
    } else if (settingName == pskl.UserSettings.CANVAS_BACKGROUND) {
      this.updateBackgroundClass_(settingValue);
    }
  };

  ns.FrameRenderer.prototype.updateBackgroundClass_ = function (newClass) {
    var currentClass = this.container.data('current-background-class');
    if (currentClass) {
      this.container.removeClass(currentClass);
    }
    this.container.addClass(newClass);
    this.container.data('current-background-class', newClass);
  };

  ns.FrameRenderer.prototype.renderPixel_ = function (color, x, y, context) {
    if(color != Constants.TRANSPARENT_COLOR) {
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  };

  /**
   * Transform a screen pixel-based coordinate (relative to the top-left corner of the rendered
   * frame) into a sprite coordinate in column and row.
   * @public
   */
  ns.FrameRenderer.prototype.getCoordinates = function(x, y) {
    var containerOffset = this.container.offset();
    x = x - containerOffset.left;
    y = y - containerOffset.top;

    // apply margins
    x = x - this.margin.x;
    y = y - this.margin.y;

    var cellSize = this.zoom + this.gridStrokeWidth;
    // apply frame offset
    x = x + this.offset.x * cellSize;
    y = y + this.offset.y * cellSize;

    return {
      x : (x / cellSize) | 0,
      y : (y / cellSize) | 0
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
    for(var x = 0, width = frame.getWidth(); x < width; x++) {
      for(var y = 0, height = frame.getHeight(); y < height; y++) {
        var color = frame.getPixel(x, y);
        this.renderPixel_(color, x, y, context);
      }
    }

    this.updateMargins_();

    context = this.displayCanvas.getContext('2d');
    context.save();
    // zoom < 1
    context.fillStyle = "#aaa";
    // zoom < 1
    context.fillRect(0,0,this.displayCanvas.width, this.displayCanvas.height);
    context.translate(this.margin.x, this.margin.y);
    context.scale(this.zoom, this.zoom);
    context.translate(-this.offset.x, -this.offset.y);
    // zoom < 1
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.drawImage(this.canvas, 0, 0);
    context.restore();
  };
})();