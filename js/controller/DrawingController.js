(function () {
  var ns = $.namespace("pskl.controller");
  ns.DrawingController = function (piskelController, container) {
    /**
     * @public
     */
    this.piskelController = piskelController;

    /**
     * @public
     */
    this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(piskelController.getCurrentFrame());

    /**
     * @private
     */
    this.container = container;

    this.zoom = this.calculateZoom_();
    this.xOffset = 0;
    this.yOffset = 0;

    // TODO(vincz): Store user prefs in a localstorage string ?
    var renderingOptions = {
      "zoom": this.zoom,
      "supportGridRendering" : true,
      "height" : this.getContainerHeight_(),
      "width" : this.getContainerWidth_(),
      "xOffset" : this.xOffset,
      "yOffset" : this.yOffset
    };

    this.overlayRenderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, ["canvas-overlay"]);
    this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, ["drawing-canvas"]);
    this.layersBelowRenderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, ["layers-canvas", "layers-below-canvas"]);
    this.layersAboveRenderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, ["layers-canvas", "layers-above-canvas"]);


    // State of drawing controller:
    this.isClicked = false;
    this.isRightClicked = false;
    this.previousMousemoveTime = 0;
    this.currentToolBehavior = null;
    this.primaryColor =  Constants.DEFAULT_PEN_COLOR;
    this.secondaryColor =  Constants.TRANSPARENT_COLOR;
  };

  ns.DrawingController.prototype.init = function () {
    this.initMouseBehavior();

    $.subscribe(Events.TOOL_SELECTED, $.proxy(function(evt, toolBehavior) {
      console.log("Tool selected: ", toolBehavior);
      this.currentToolBehavior = toolBehavior;
      this.overlayFrame.clear();
    }, this));

    /**
     * TODO(grosbouddha): Primary/secondary color state are kept in this general controller.
     *     Find a better place to store that. Perhaps PaletteController?
     */
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, $.proxy(function(evt, color) {
      console.log("Primary color selected: ", color);
      this.primaryColor = color;
      $.publish(Events.PRIMARY_COLOR_UPDATED, [color]);
    }, this));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, $.proxy(function(evt, color) {
      console.log("Secondary color selected: ", color);
      this.secondaryColor = color;
      $.publish(Events.SECONDARY_COLOR_UPDATED, [color]);
    }, this));

    $(window).resize($.proxy(this.startDPIUpdateTimer_, this));

    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, $.proxy(this.updateZoom_, this));

    this.updateZoom_();
  };

  ns.DrawingController.prototype.initMouseBehavior = function() {
    var body = $('body');
    this.container.mousedown($.proxy(this.onMousedown_, this));
    this.container.mousemove($.proxy(this.onMousemove_, this));
    this.container.on('mousewheel', $.proxy(this.onMousewheel_, this));

    body.mouseup($.proxy(this.onMouseup_, this));

    // Deactivate right click:
    body.contextmenu(this.onCanvasContextMenu_);
  };

  ns.DrawingController.prototype.startDPIUpdateTimer_ = function () {
    if (this.zoomUpdateTimer) {
      window.clearInterval(this.zoomUpdateTimer);
    }
    this.zoomUpdateTimer = window.setTimeout($.proxy(this.updateZoom_, this), 200);
  },

  /**
   * @private
   */
  ns.DrawingController.prototype.onUserSettingsChange_ = function (evt, settingsName, settingsValue) {
    if(settingsName == pskl.UserSettings.SHOW_GRID) {
      this.updateZoom_();
    }
  },

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousedown_ = function (event) {
    this.isClicked = true;

    if(event.button == 2) { // right click
      this.isRightClicked = true;
      $.publish(Events.CANVAS_RIGHT_CLICKED);
    }

    var coords = this.getSpriteCoordinates(event);

    this.currentToolBehavior.applyToolAt(
      coords.col, coords.row,
      this.getCurrentColor_(),
      this.piskelController.getCurrentFrame(),
      this.overlayFrame,
      this.wrapEvtInfo_(event)
    );

    $.publish(Events.LOCALSTORAGE_REQUEST);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousemove_ = function (event) {
    var currentTime = new Date().getTime();
    // Throttling of the mousemove event:
    if ((currentTime - this.previousMousemoveTime) > 40 ) {
      var coords = this.getSpriteCoordinates(event);
      if (this.isClicked) {

        this.currentToolBehavior.moveToolAt(
          coords.col, coords.row,
          this.getCurrentColor_(),
          this.piskelController.getCurrentFrame(),
          this.overlayFrame,
          this.wrapEvtInfo_(event)
        );

        // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
        // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
        // you don't need to draw anything when mousemoving and you request useless localStorage.
        $.publish(Events.LOCALSTORAGE_REQUEST);
      } else {

        this.currentToolBehavior.moveUnactiveToolAt(
          coords.col, coords.row,
          this.getCurrentColor_(),
          this.piskelController.getCurrentFrame(),
          this.overlayFrame,
          this.wrapEvtInfo_(event)
        );
      }
      this.previousMousemoveTime = currentTime;
    }
  };

  ns.DrawingController.prototype.onMousewheel_ = function (jQueryEvent) {
    var event = jQueryEvent.originalEvent;
    var delta = event.wheelDeltaY;
    if (delta > 0) {
      this.setZoom(this.zoom + 1);
    } else if (delta < 0) {
      this.setZoom(this.zoom - 1);
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMouseup_ = function (event) {
    if(this.isClicked || this.isRightClicked) {
      // A mouse button was clicked on the drawing canvas before this mouseup event,
      // the user was probably drawing on the canvas.
      // Note: The mousemove movement (and the mouseup) may end up outside
      // of the drawing canvas.

      this.isClicked = false;
      this.isRightClicked = false;

      var coords = this.getSpriteCoordinates(event);
      //console.log("mousemove: col: " + spriteCoordinate.col + " - row: " + spriteCoordinate.row);
      this.currentToolBehavior.releaseToolAt(
        coords.col, coords.row,
        this.getCurrentColor_(),
        this.piskelController.getCurrentFrame(),
        this.overlayFrame,
        this.wrapEvtInfo_(event)
      );

      $.publish(Events.TOOL_RELEASED);
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.wrapEvtInfo_ = function (event) {
    var evtInfo = {};
    if (event.button === 0) {
      evtInfo.button = Constants.LEFT_BUTTON;
    } else if (event.button == 2) {
      evtInfo.button = Constants.RIGHT_BUTTON;
    }
    return evtInfo;
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.getRelativeCoordinates = function (clientX, clientY) {
    var canvasPageOffset = this.container.offset();
    return {
      x : clientX - canvasPageOffset.left,
      y : clientY - canvasPageOffset.top
    };
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.getSpriteCoordinates = function(event) {
    var coords = this.getRelativeCoordinates(event.clientX, event.clientY);
    return this.renderer.convertPixelCoordinatesIntoSpriteCoordinate(coords);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.getCurrentColor_ = function () {
    if(this.isRightClicked) {
      return this.secondaryColor;
    } else {
      return this.primaryColor;
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onCanvasContextMenu_ = function (event) {
    if ($(event.target).closest('#drawing-canvas-container').length) {
      // Deactivate right click on drawing canvas only.
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    }
  };

  ns.DrawingController.prototype.render = function () {
    this.renderLayers();
    this.renderFrame();
    this.renderOverlay();
  };

  ns.DrawingController.prototype.renderFrame = function () {
    var frame = this.piskelController.getCurrentFrame();
    var serializedFrame = [this.zoom, this.xOffset, this.yOffset, frame.serialize()].join('-');
    if (this.serializedFrame != serializedFrame) {
      if (!frame.isSameSize(this.overlayFrame)) {
        this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(frame);
      }
      this.serializedFrame = serializedFrame;
      this.renderer.render(frame);
    }
  };

  ns.DrawingController.prototype.renderOverlay = function () {
    var serializedOverlay = [this.zoom, this.xOffset, this.yOffset, this.overlayFrame.serialize()].join('-');
    if (this.serializedOverlay != serializedOverlay) {
      this.serializedOverlay = serializedOverlay;
      this.overlayRenderer.render(this.overlayFrame);
    }
  };

  ns.DrawingController.prototype.renderLayers = function () {
    var layers = this.piskelController.getLayers();
    var currentFrameIndex = this.piskelController.currentFrameIndex;
    var currentLayerIndex = this.piskelController.currentLayerIndex;

    var serializedLayerFrame = [
      this.zoom,
      currentFrameIndex,
      currentLayerIndex,
      layers.length
    ].join("-");

    if (this.serializedLayerFrame != serializedLayerFrame) {
      this.layersAboveRenderer.clear();
      this.layersBelowRenderer.clear();

      var downLayers = layers.slice(0, currentLayerIndex);
      var downFrame = this.getFrameForLayersAt_(currentFrameIndex, downLayers);
      this.layersBelowRenderer.render(downFrame);

      if (currentLayerIndex + 1 < layers.length) {
        var upLayers = layers.slice(currentLayerIndex + 1, layers.length);
        var upFrame = this.getFrameForLayersAt_(currentFrameIndex, upLayers);
        this.layersAboveRenderer.render(upFrame);
      }

      this.serializedLayerFrame = serializedLayerFrame;
    }
  };

  ns.DrawingController.prototype.getFrameForLayersAt_ = function (frameIndex, layers) {
    var frames = layers.map(function (l) {
      return l.getFrameAt(frameIndex);
    });
    return pskl.utils.FrameUtils.merge(frames);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.calculateZoom_ = function() {
    var frameHeight = this.piskelController.getCurrentFrame().getHeight(),
        frameWidth = this.piskelController.getCurrentFrame().getWidth();

    return Math.min(this.getAvailableWidth_()/frameWidth, this.getAvailableHeight_()/frameHeight);
  };

  ns.DrawingController.prototype.getAvailableHeight_ = function () {
    return $('#main-wrapper').height();
  };

  ns.DrawingController.prototype.getAvailableWidth_ = function () {
    var leftSectionWidth = $('.left-column').outerWidth(true),
    rightSectionWidth = $('.right-column').outerWidth(true),
    availableWidth = $('#main-wrapper').width() - leftSectionWidth - rightSectionWidth;
    return availableWidth;
  };

  ns.DrawingController.prototype.getContainerHeight_ = function () {
    return this.calculateZoom_() * this.piskelController.getCurrentFrame().getHeight();
  };

  ns.DrawingController.prototype.getContainerWidth_ = function () {
    return this.calculateZoom_() * this.piskelController.getCurrentFrame().getWidth();
  };
  /**
   * @private
   */
  ns.DrawingController.prototype.updateZoom_ = function() {
    this.setZoom(this.calculateZoom_());

    var currentFrameHeight =  this.piskelController.getCurrentFrame().getHeight();
    var canvasHeight = currentFrameHeight * this.zoom;
    if (pskl.UserSettings.get(pskl.UserSettings.SHOW_GRID)) {
      canvasHeight += Constants.GRID_STROKE_WIDTH * currentFrameHeight;
    }

    var verticalGapInPixel = Math.floor(($('#main-wrapper').height() - canvasHeight) / 2);
    $('#column-wrapper').css({
      'top': verticalGapInPixel + 'px',
      'height': canvasHeight + 'px'
    });
  };

  ns.DrawingController.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
    this.overlayRenderer.setZoom(this.zoom);
    this.renderer.setZoom(this.zoom);
    this.layersAboveRenderer.setZoom(this.zoom);
    this.layersBelowRenderer.setZoom(this.zoom);
  };

  ns.DrawingController.prototype.moveOffset = function (xOffset, yOffset) {
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.overlayRenderer.setDisplayOffset(xOffset, yOffset);
    this.renderer.setDisplayOffset(xOffset, yOffset);
    this.layersAboveRenderer.setDisplayOffset(xOffset, yOffset);
    this.layersBelowRenderer.setDisplayOffset(xOffset, yOffset);
  };
})();