(function () {
  var ns = $.namespace("pskl.rendering.frame");

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
    if (zoom > Constants.MINIMUM_ZOOM) {
      // back up center coordinates
      var centerX = this.offset.x + (this.displayWidth/(2*this.zoom));
      var centerY = this.offset.y + (this.displayHeight/(2*this.zoom));

      this.zoom = zoom;
      // recenter
      this.setOffset(
        centerX - (this.displayWidth/(2*this.zoom)),
        centerY - (this.displayHeight/(2*this.zoom))
      );
    }
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
    var maxX = width - (this.displayWidth/this.zoom);
    x = pskl.utils.Math.minmax(x, 0, maxX);
    var maxY = height - (this.displayHeight/this.zoom);
    y = pskl.utils.Math.minmax(y, 0, maxY);

    this.offset.x = x;
    this.offset.y = y;
  };

  ns.FrameRenderer.prototype.setGridWidth = function (value) {
    this.gridWidth_ = value;
  };

  ns.FrameRenderer.prototype.getGridWidth = function () {
    if (this.supportGridRendering) {
      return this.gridWidth_;
    } else {
      return 0;
    }
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
      x : x + (cellSize/2),
      y : y + (cellSize/2)
    };
  };

  /**
   * @private
   */
  ns.FrameRenderer.prototype.renderFrame_ = function (frame) {
    if (!this.canvas || frame.getWidth() != this.canvas.width || frame.getHeight() != this.canvas.height) {
      this.canvas = pskl.utils.CanvasUtils.createCanvas(frame.getWidth(), frame.getHeight());
    }

    var context = this.canvas.getContext('2d');
    for(var x = 0, width = frame.getWidth(); x < width; x++) {
      for(var y = 0, height = frame.getHeight(); y < height; y++) {
        var color = frame.getPixel(x, y);
        var w = 1;
        while (color === frame.getPixel(x, y+w)) {
          w++;
        }
        this.renderLine_(color, x, y, w, context);
        y = y + w - 1;
      }
    }

    this.updateMargins_(frame);

    var displayContext = this.displayCanvas.getContext('2d');
    displayContext.save();

    if (this.canvas.width*this.zoom < this.displayCanvas.width || this.canvas.height*this.zoom < this.displayCanvas.height) {
      displayContext.fillStyle = Constants.ZOOMED_OUT_BACKGROUND_COLOR;
      displayContext.fillRect(0,0,this.displayCanvas.width - 1, this.displayCanvas.height - 1);
    }

    displayContext.translate(
      this.margin.x-this.offset.x*this.zoom,
      this.margin.y-this.offset.y*this.zoom
    );

    displayContext.clearRect(0, 0, this.canvas.width*this.zoom, this.canvas.height*this.zoom);

    var isIE10 = pskl.utils.UserAgent.isIE && pskl.utils.UserAgent.version === 10;

    var gridWidth = this.getGridWidth();
    var isGridEnabled = gridWidth > 0;
    if (isGridEnabled || isIE10) {
      var scaled = pskl.utils.ImageResizer.resizeNearestNeighbour(this.canvas, this.zoom, gridWidth);
      displayContext.drawImage(scaled, 0, 0);
    } else {
      displayContext.scale(this.zoom, this.zoom);
      displayContext.drawImage(this.canvas, 0, 0);
    }
    displayContext.restore();
  };

  ns.FrameRenderer.prototype.renderPixel_ = function (color, x, y, context) {
    if(color != Constants.TRANSPARENT_COLOR) {
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  };

  ns.FrameRenderer.prototype.renderLine_ = function (color, x, y, width, context) {
    if(color != Constants.TRANSPARENT_COLOR) {
      context.fillStyle = color;
      context.fillRect(x, y, 1, width);
    }
  };
})();