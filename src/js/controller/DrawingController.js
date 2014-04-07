(function () {
  var ns = $.namespace("pskl.controller");
  ns.DrawingController = function (piskelController, paletteController, container) {
    /**
     * @public
     */
    this.piskelController = piskelController;

    this.paletteController = paletteController;

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
    this.previousMousemoveTime = 0;
    this.currentToolBehavior = null;

    // State of clicked button (need to be stateful here, see comment in getCurrentColor_)
    this.currentMouseButton_ = Constants.LEFT_BUTTON;
  };

  ns.DrawingController.prototype.init = function () {
    this.initMouseBehavior();

    $.subscribe(Events.TOOL_SELECTED, $.proxy(function(evt, toolBehavior) {
      this.currentToolBehavior = toolBehavior;
      this.overlayFrame.clear();
    }, this));

    $(window).resize($.proxy(this.startResizeTimer_, this));

    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, $.proxy(this.onFrameSizeChanged_, this));

    // this.afterWindowResize_.bind(this);
    window.setTimeout(this.afterWindowResize_.bind(this), 100);
  };

  ns.DrawingController.prototype.initMouseBehavior = function() {
    var body = $('body');
    this.container.mousedown($.proxy(this.onMousedown_, this));

    if (pskl.utils.UserAgent.isChrome) {
      this.container.on('mousewheel', $.proxy(this.onMousewheel_, this));
    } else {
      this.container.on('wheel', $.proxy(this.onMousewheel_, this));
    }

    window.addEventListener('mouseup', this.onMouseup_.bind(this));
    window.addEventListener('mousemove', this.onMousemove_.bind(this));

    // Deactivate right click:
    body.contextmenu(this.onCanvasContextMenu_);
  };

  ns.DrawingController.prototype.startResizeTimer_ = function () {
    if (this.resizeTimer) {
      window.clearInterval(this.resizeTimer);
    }
    this.resizeTimer = window.setTimeout($.proxy(this.afterWindowResize_, this), 200);
  };

  ns.DrawingController.prototype.afterWindowResize_ = function () {
    var initialWidth = this.compositeRenderer.getDisplaySize().width;
    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
    this.centerColumnWrapperHorizontally_();
    var ratio = this.compositeRenderer.getDisplaySize().width / initialWidth;
    var newZoom = ratio * this.compositeRenderer.getZoom();
    this.compositeRenderer.setZoom(newZoom);

    $.publish(Events.ZOOM_CHANGED);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onUserSettingsChange_ = function (evt, settingsName, settingsValue) {
    if(settingsName == pskl.UserSettings.SHOW_GRID) {
      console.warn('DrawingController:onUserSettingsChange_ not implemented !');
    }
  };

  ns.DrawingController.prototype.onFrameSizeChanged_ = function () {
    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
    this.compositeRenderer.setZoom(this.calculateZoom_());
    this.compositeRenderer.setOffset(0, 0);
    $.publish(Events.ZOOM_CHANGED);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousedown_ = function (event) {
    var frame = this.piskelController.getCurrentFrame();
    var coords = this.renderer.getCoordinates(event.clientX, event.clientY);

    if (event.button === Constants.MIDDLE_BUTTON) {
      if (frame.containsPixel(coords.x, coords.y)) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [frame.getPixel(coords.x, coords.y)]);
      }
    } else {
      this.isClicked = true;
      this.setCurrentButton(event);
      this.currentToolBehavior.hideHighlightedPixel(this.overlayFrame);

      this.currentToolBehavior.applyToolAt(
        coords.x,
        coords.y,
        this.getCurrentColor_(),
        frame,
        this.overlayFrame,
        event
      );

      $.publish(Events.LOCALSTORAGE_REQUEST);
    }
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
        // Warning : do not call setCurrentButton here
        // mousemove do not have the correct mouse button information on all browsers
        this.currentToolBehavior.moveToolAt(
          coords.x,
          coords.y,
          this.getCurrentColor_(event),
          this.piskelController.getCurrentFrame(),
          this.overlayFrame,
          event
        );

        // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
        // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
        // you don't need to draw anything when mousemoving and you request useless localStorage.
        $.publish(Events.LOCALSTORAGE_REQUEST);
      } else {

        this.currentToolBehavior.moveUnactiveToolAt(
          coords.x,
          coords.y,
          this.getCurrentColor_(event),
          this.piskelController.getCurrentFrame(),
          this.overlayFrame,
          event
        );
      }
      this.previousMousemoveTime = currentTime;
    }
  };

  ns.DrawingController.prototype.onMousewheel_ = function (jQueryEvent) {
    var event = jQueryEvent.originalEvent;
    var delta = event.wheelDeltaY || (-2 * event.deltaY);
    var currentZoom = this.renderer.getZoom();

    var perfectZoom = this.calculateZoom_();
    var step = perfectZoom / 10;

    if (delta > 0) {
      this.compositeRenderer.setZoom(currentZoom + step);
    } else if (delta < 0) {
      this.compositeRenderer.setZoom(currentZoom - step);
    }
    $.publish(Events.ZOOM_CHANGED);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMouseup_ = function (event) {
    if(this.isClicked) {
      // A mouse button was clicked on the drawing canvas before this mouseup event,
      // the user was probably drawing on the canvas.
      // Note: The mousemove movement (and the mouseup) may end up outside
      // of the drawing canvas.

      this.isClicked = false;
      this.setCurrentButton(event);

      var coords = this.renderer.getCoordinates(event.clientX, event.clientY);
      this.currentToolBehavior.releaseToolAt(
        coords.x,
        coords.y,
        this.getCurrentColor_(),
        this.piskelController.getCurrentFrame(),
        this.overlayFrame,
        event
      );

      $.publish(Events.TOOL_RELEASED);
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.getSpriteCoordinates = function(event) {
    return this.renderer.getCoordinates(event.clientX, event.clientY);
  };

  ns.DrawingController.prototype.setCurrentButton = function (event) {
    this.currentMouseButton_ = event.button;
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.getCurrentColor_ = function () {
    // WARNING : Do not rely on the current event to get the current color!
    // It might seem like a good idea, and works perfectly fine on Chrome
    // Sadly Firefox and IE found clever, for some reason, to set event.button to 0
    // on a mouse move event
    // This always matches a LEFT mouse button which is __really__ not helpful

    if(this.currentMouseButton_ == Constants.RIGHT_BUTTON) {
      return this.paletteController.getSecondaryColor();
    } else if(this.currentMouseButton_ == Constants.LEFT_BUTTON) {
      return this.paletteController.getPrimaryColor();
    } else {
      return Constants.DEFAULT_PEN_COLOR;
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
    toolsContainerWidth = $('#tool-section').outerWidth(true),
    settingsContainerWidth = $('#application-action-section').outerWidth(true),
    availableWidth = $('#main-wrapper').width() - leftSectionWidth - rightSectionWidth - toolsContainerWidth - settingsContainerWidth;

    var comfortMargin = 10;
    return availableWidth - comfortMargin;
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
    $.publish(Events.ZOOM_CHANGED);
  };
})();