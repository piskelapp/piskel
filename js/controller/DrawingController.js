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

    // TODO(vincz): Store user prefs in a localstorage string ?
    var renderingOptions = {
      "zoom": this.calculateZoom_(),
      "supportGridRendering" : true,
      "height" : this.getContainerHeight_(),
      "width" : this.getContainerWidth_(),
      "xOffset" : 0,
      "yOffset" : 0
    };

    this.overlayRenderer = new pskl.rendering.frame.CachedFrameRenderer(this.container, renderingOptions, ["canvas-overlay"]);
    this.renderer = new pskl.rendering.frame.CachedFrameRenderer(this.container, renderingOptions, ["drawing-canvas"]);
    this.layersRenderer = new pskl.rendering.layer.LayersRenderer(this.container, renderingOptions, piskelController);

    this.compositeRenderer = new pskl.rendering.CompositeRenderer();
    this.compositeRenderer
      .add(this.overlayRenderer)
      .add(this.renderer)
      .add(this.layersRenderer);

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

    $(window).resize($.proxy(this.startResizeTimer_, this));

    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, $.proxy(this.onFrameSizeChanged_, this));

    this.centerColumnWrapperHorizontally_();
  };

  ns.DrawingController.prototype.initMouseBehavior = function() {
    var body = $('body');
    this.container.mousedown($.proxy(this.onMousedown_, this));
    this.container.mousemove($.proxy(this.onMousemove_, this));

    if (pskl.utils.UserAgent.isChrome) {
      this.container.on('mousewheel', $.proxy(this.onMousewheel_, this));
    } else {
      this.container.on('wheel', $.proxy(this.onMousewheel_, this));
    }

    body.mouseup($.proxy(this.onMouseup_, this));

    // Deactivate right click:
    body.contextmenu(this.onCanvasContextMenu_);
  };

  ns.DrawingController.prototype.startResizeTimer_ = function () {
    if (this.resizeTimer) {
      window.clearInterval(this.resizeTimer);
    }
    this.resizeTimer = window.setTimeout($.proxy(this.afterWindowResize_, this), 200);
  },

  ns.DrawingController.prototype.afterWindowResize_ = function () {
    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
  },

  /**
   * @private
   */
  ns.DrawingController.prototype.onUserSettingsChange_ = function (evt, settingsName, settingsValue) {
    if(settingsName == pskl.UserSettings.SHOW_GRID) {
      console.warn('DrawingController:onUserSettingsChange_ not implemented !');
    }
  },

  ns.DrawingController.prototype.onFrameSizeChanged_ = function () {
    this.compositeRenderer.setZoom(this.calculateZoom_());
    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousedown_ = function (event) {
    this.isClicked = true;

    if(event.button == 2) { // right click
      this.isRightClicked = true;
      $.publish(Events.CANVAS_RIGHT_CLICKED);
    }

    var coords = this.renderer.getCoordinates(event.clientX, event.clientY);

    this.currentToolBehavior.applyToolAt(
      coords.x,
      coords.y,
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
    if ((currentTime - this.previousMousemoveTime) > Constants.MOUSEMOVE_THROTTLING ) {
      var coords = this.renderer.getCoordinates(event.clientX, event.clientY);

      if (this.isClicked) {

        this.currentToolBehavior.moveToolAt(
          coords.x,
          coords.y,
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
          coords.x,
          coords.y,
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
    var delta = event.wheelDeltaY || (-2 * event.deltaY);
    var currentZoom = this.renderer.getZoom();
    if (delta > 0) {
      this.compositeRenderer.setZoom(currentZoom + 1);
    } else if (delta < 0) {
      this.compositeRenderer.setZoom(currentZoom - 1);
    }
    pskl.app.minimapController.onDrawingControllerMove_();
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

      var coords = this.renderer.getCoordinates(event.clientX, event.clientY);
      //console.log("mousemove: col: " + spriteCoordinate.col + " - row: " + spriteCoordinate.row);
      this.currentToolBehavior.releaseToolAt(
        coords.x,
        coords.y,
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
  ns.DrawingController.prototype.getSpriteCoordinates = function(event) {
    return this.renderer.getCoordinates(event.clientX, event.clientY);
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
    var currentFrame = this.piskelController.getCurrentFrame();
    if (!currentFrame.isSameSize(this.overlayFrame)) {
      this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(currentFrame);
    }

    this.layersRenderer.render();
    this.renderer.render(currentFrame);
    this.overlayRenderer.render(this.overlayFrame);
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
  ns.DrawingController.prototype.centerColumnWrapperHorizontally_ = function() {
    var containerHeight = this.getContainerHeight_();
    var verticalGapInPixel = Math.floor(($('#main-wrapper').height() - containerHeight) / 2);
    $('#column-wrapper').css({
      'top': verticalGapInPixel + 'px'
    });
  };

  ns.DrawingController.prototype.getRenderer = function () {
    return this.compositeRenderer;
  };

  ns.DrawingController.prototype.setOffset = function (x, y) {
    this.compositeRenderer.setOffset(x, y);
    pskl.app.minimapController.onDrawingControllerMove_();
  };
})();