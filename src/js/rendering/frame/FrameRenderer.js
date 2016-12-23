(function () {
  var ns = $.namespace('pskl.rendering.frame');

  /**
   * FrameRenderer will display a given frame inside a canvas element.
   * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
   * @param {Object} renderingOptions
   * @param {Array} classList array of strings to use for css classList
   */
  ns.FrameRenderer = function (container, renderingOptions, classList) {
    this.defaultRenderingOptions = {
      'supportGridRendering' : false,
      'zoom' : 1
    };

    renderingOptions = $.extend(true, {}, this.defaultRenderingOptions, renderingOptions);

    if (container === undefined) {
      throw 'Bad FrameRenderer initialization. <container> undefined.';
    }

    if (isNaN(renderingOptions.zoom)) {
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

    this.classList = classList || [];
    this.classList.push('canvas');

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

    this.setGridWidth(pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH));

    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
  };

  pskl.utils.inherit(pskl.rendering.frame.FrameRenderer, pskl.rendering.AbstractRenderer);

  ns.FrameRenderer.prototype.render = function (frame) {
    if (frame) {
      this.clear();
      this.renderFrame_(frame);
    }
  };

  ns.FrameRenderer.prototype.clear = function () {
    pskl.utils.CanvasUtils.clear(this.canvas);
    pskl.utils.CanvasUtils.clear(this.displayCanvas);
  };

  ns.FrameRenderer.prototype.setZoom = function (zoom) {
    // Minimum zoom is one to ensure one sprite pixel occupies at least one pixel on screen.
    var minimumZoom = 1;
    // Maximum zoom is relative to the display dimensions to ensure at least 10 pixels can
    // be drawn on screen.
    var maximumZoom = Math.min(this.displayWidth, this.displayHeight) / 10;
    zoom = pskl.utils.Math.minmax(zoom, minimumZoom, maximumZoom);

    if (zoom == this.zoom) {
      return;
    }

    // back up center coordinates
    var centerX = this.offset.x + (this.displayWidth / (2 * this.zoom));
    var centerY = this.offset.y + (this.displayHeight / (2 * this.zoom));

    this.zoom = zoom;
    // recenter
    this.setOffset(
      centerX - (this.displayWidth / (2 * this.zoom)),
      centerY - (this.displayHeight / (2 * this.zoom))
    );
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
  };

  ns.FrameRenderer.prototype.setOffset = function (x, y) {
    var width = pskl.app.piskelController.getWidth();
    var height = pskl.app.piskelController.getHeight();
    var maxX = width - (this.displayWidth / this.zoom);
    x = pskl.utils.Math.minmax(x, 0, maxX);
    var maxY = height - (this.displayHeight / this.zoom);
    y = pskl.utils.Math.minmax(y, 0, maxY);

    this.offset.x = x;
    this.offset.y = y;
  };

  ns.FrameRenderer.prototype.setGridWidth = function (value) {
    this.gridWidth_ = value;
  };

  ns.FrameRenderer.prototype.getGridWidth = function () {
    if (!this.supportGridRendering) {
      return 0;
    }

    return this.gridWidth_;
  };

  /**
   * Compute a grid width value best suited to the current display context,
   * particularly for the current zoom level
   */
  ns.FrameRenderer.prototype.computeGridWidthForDisplay_ = function () {
    var gridWidth = this.getGridWidth();
    while (this.zoom < 6 * gridWidth) {
      gridWidth--;
    }
    return gridWidth;
  };

  ns.FrameRenderer.prototype.updateMargins_ = function (frame) {
    var deltaX = this.displayWidth - (this.zoom * frame.getWidth());
    this.margin.x = Math.max(0, deltaX) / 2;

    var deltaY = this.displayHeight - (this.zoom * frame.getHeight());
    this.margin.y = Math.max(0, deltaY) / 2;
  };

  ns.FrameRenderer.prototype.createDisplayCanvas_ = function () {
    var height = this.displayHeight;
    var width = this.displayWidth;

    this.displayCanvas = pskl.utils.CanvasUtils.createCanvas(width, height, this.classList);
    pskl.utils.CanvasUtils.disableImageSmoothing(this.displayCanvas);
    this.container.append(this.displayCanvas);
  };

  ns.FrameRenderer.prototype.onUserSettingsChange_ = function (evt, settingName, settingValue) {
    if (settingName == pskl.UserSettings.GRID_WIDTH) {
      this.setGridWidth(settingValue);
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

    var cellSize = this.zoom;
    // apply frame offset
    x = x + this.offset.x * cellSize;
    y = y + this.offset.y * cellSize;

    return {
      x : Math.floor(x / cellSize),
      y : Math.floor(y / cellSize)
    };
  };

  ns.FrameRenderer.prototype.reverseCoordinates = function(x, y) {
    var cellSize = this.zoom;

    x = x * cellSize;
    y = y * cellSize;

    x = x - this.offset.x * cellSize;
    y = y - this.offset.y * cellSize;

    x = x + this.margin.x;
    y = y + this.margin.y;

    var containerOffset = this.container.offset();
    x = x + containerOffset.left;
    y = y + containerOffset.top;

    return {
      x : x + (cellSize / 2),
      y : y + (cellSize / 2)
    };
  };

  /**
   * @private
   */
  ns.FrameRenderer.prototype.renderFrame_ = function (frame) {
    if (!this.canvas || frame.getWidth() != this.canvas.width || frame.getHeight() != this.canvas.height) {
      this.canvas = pskl.utils.CanvasUtils.createCanvas(frame.getWidth(), frame.getHeight());
    }

    var w = this.canvas.width;
    var h = this.canvas.height;
    var z = this.zoom;

    // Draw in canvas
    pskl.utils.FrameUtils.drawToCanvas(frame, this.canvas);

    this.updateMargins_(frame);

    var displayContext = this.displayCanvas.getContext('2d');
    displayContext.save();

    // Draw background
    displayContext.fillStyle = Constants.ZOOMED_OUT_BACKGROUND_COLOR;
    displayContext.fillRect(0, 0, this.displayCanvas.width - 1, this.displayCanvas.height - 1);

    displayContext.translate(
      this.margin.x - this.offset.x * z,
      this.margin.y - this.offset.y * z
    );

    // Scale up to draw the canvas content
    displayContext.scale(z, z);

    if (pskl.UserSettings.get('SEAMLESS_MODE')) {
      displayContext.clearRect(-1 * w, -1 * h, 3 * w, 3 * h);
    } else {
      displayContext.clearRect(0, 0, w, h);
    }

    if (pskl.UserSettings.get('SEAMLESS_MODE')) {
      this.drawTiledFrames_(displayContext, this.canvas, w, h, 1);
    }
    displayContext.drawImage(this.canvas, 0, 0);

    // Draw grid.
    var gridWidth = this.computeGridWidthForDisplay_();
    if (gridWidth > 0) {
      // Scale out before drawing the grid.
      displayContext.scale(1 / z, 1 / z);
      for (var i = 1 ; i < frame.getWidth() ; i++) {
        displayContext.clearRect((i * z) - (gridWidth / 2), 0, gridWidth, h * z);
      }
      for (var i = 1 ; i < frame.getHeight() ; i++) {
        displayContext.clearRect(0, (i * z) - (gridWidth / 2), w * z, gridWidth);
      }
    }

    displayContext.restore();
  };

  /**
   * Draw repeatedly the provided image around the main drawing area. Used for seamless
   * drawing mode, to easily create seamless textures. A colored overlay is applied to
   * differentiate those additional frames from the main frame.
   */
  ns.FrameRenderer.prototype.drawTiledFrames_ = function (context, image, w, h, z) {
    var opacity = pskl.UserSettings.get('SEAMLESS_OPACITY');
    opacity = pskl.utils.Math.minmax(opacity, 0, 1);
    context.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
    [[0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]].forEach(function (d) {
      context.drawImage(image, d[0] * w * z, d[1] * h * z);
      context.fillRect(d[0] * w * z, d[1] * h * z, w * z, h * z);
    });
  };
})();
