(function () {

  var ns = $.namespace('pskl.controller');

  ns.DrawingController = function (piskelController, paletteController, container) {
    /**
     * @public
     */
    this.piskelController = piskelController;

    this.paletteController = paletteController;

    this.dragHandler = new ns.drawing.DragHandler(this);

    /**
     * @public
     */
    this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(piskelController.getCurrentFrame());

    /**
     * @private
     */
    this.container = container;

    var cfg = {
      'zoom': this.calculateZoom_(),
      'supportGridRendering' : true,
      'height' : this.getContainerHeight_(),
      'width' : this.getContainerWidth_(),
      'xOffset' : 0,
      'yOffset' : 0
    };

    this.overlayRenderer = new pskl.rendering.frame.CachedFrameRenderer(this.container, cfg, ['canvas-overlay']);
    this.renderer = new pskl.rendering.frame.CachedFrameRenderer(this.container, cfg, ['drawing-canvas']);
    this.onionSkinRenderer = pskl.rendering.OnionSkinRenderer.createInContainer(this.container, cfg, piskelController);
    this.layersRenderer = new pskl.rendering.layer.LayersRenderer(this.container, cfg, piskelController);

    this.compositeRenderer = new pskl.rendering.CompositeRenderer();
    this.compositeRenderer
      .add(this.overlayRenderer)
      .add(this.renderer)
      .add(this.layersRenderer)
      .add(this.onionSkinRenderer);

    // State of drawing controller:
    this.isClicked = false;
    this.previousMousemoveTime = 0;
    this.currentToolBehavior = null;
  };

  ns.DrawingController.prototype.init = function () {
    this.initMouseBehavior();

    $.subscribe(Events.TOOL_SELECTED, $.proxy(function(evt, toolBehavior) {
      this.currentToolBehavior = toolBehavior;
      this.overlayFrame.clear();
    }, this));

    $(window).resize($.proxy(this.startResizeTimer_, this));

    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));

    var shortcuts = pskl.service.keyboard.Shortcuts;
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.RESET_ZOOM, this.resetZoom_.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.INCREASE_ZOOM, this.increaseZoom_.bind(this, 1));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.DECREASE_ZOOM, this.decreaseZoom_.bind(this, 1));

    window.setTimeout(function () {
      this.afterWindowResize_();
      this.resetZoom_();
    }.bind(this), 100);
  };

  ns.DrawingController.prototype.initMouseBehavior = function() {
    var body = $('body');
    this.container.mousedown($.proxy(this.onMousedown_, this));

    if (pskl.utils.UserAgent.isChrome || pskl.utils.UserAgent.isIE11) {
      this.container.on('mousewheel', $.proxy(this.onMousewheel_, this));
    } else {
      this.container.on('wheel', $.proxy(this.onMousewheel_, this));
    }

    window.addEventListener('mouseup', this.onMouseup_.bind(this));
    window.addEventListener('mousemove', this.onMousemove_.bind(this));
    window.addEventListener('keyup', this.onKeyup_.bind(this));
    window.addEventListener('touchstart', this.onMousedown_.bind(this));
    window.addEventListener('touchmove' , this.onMousemove_.bind(this));
    window.addEventListener('touchend', this.onMouseup_.bind(this));
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
    if (settingsName == pskl.UserSettings.SHOW_GRID) {
      console.warn('DrawingController:onUserSettingsChange_ not implemented !');
    } else if (settingsName == pskl.UserSettings.ONION_SKIN || settingsName == pskl.UserSettings.LAYER_PREVIEW) {
      this.onionSkinRenderer.clear();
      this.onionSkinRenderer.flush();
      this.layersRenderer.clear();
      this.layersRenderer.flush();
      this.render();
    }
  };

  ns.DrawingController.prototype.onFrameSizeChange_ = function () {
    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
    this.centerColumnWrapperHorizontally_();
    this.compositeRenderer.setZoom(this.calculateZoom_());
    this.compositeRenderer.setOffset(0, 0);
    $.publish(Events.ZOOM_CHANGED);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousedown_ = function (event) {
    $.publish(Events.MOUSE_EVENT, [event, this]);
    var frame = this.piskelController.getCurrentFrame();
    var coords = this.getSpriteCoordinates(event.clientX, event.clientY);
    if (event.changedTouches && event.changedTouches[0]) {
      coords = this.getSpriteCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }

    this.isClicked = true;

    if (event.button === Constants.MIDDLE_BUTTON) {
      this.dragHandler.startDrag(event.clientX, event.clientY);
    } else {
      this.currentToolBehavior.hideHighlightedPixel(this.overlayFrame);
      $.publish(Events.TOOL_PRESSED);
      this.currentToolBehavior.applyToolAt(
        coords.x,
        coords.y,
        frame,
        this.overlayFrame,
        event
      );
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousemove_ = function (event) {
    this._clientX = event.clientX;
    this._clientY = event.clientY;
    if (event.changedTouches && event.changedTouches[0]) {
      this._clientX = event.changedTouches[0].clientX;
      this._clientY = event.changedTouches[0].clientY;
    }

    var currentTime = new Date().getTime();
    // Throttling of the mousemove event:

    if ((currentTime - this.previousMousemoveTime) > Constants.MOUSEMOVE_THROTTLING) {
      this.moveTool_(this._clientX, this._clientY, event);
      this.previousMousemoveTime = currentTime;
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onKeyup_ = function (event) {
    this.moveTool_(this._clientX, this._clientY, event);
  };

  ns.DrawingController.prototype.moveTool_ = function (x, y, event) {
    var coords = this.getSpriteCoordinates(x, y);
    var currentFrame = this.piskelController.getCurrentFrame();

    if (this.isClicked) {
      if (pskl.app.mouseStateService.isMiddleButtonPressed()) {
        this.dragHandler.updateDrag(x, y);
      } else {
        $.publish(Events.MOUSE_EVENT, [event, this]);
        this.currentToolBehavior.moveToolAt(
          coords.x | 0,
          coords.y | 0,
          currentFrame,
          this.overlayFrame,
          event
        );
      }
    } else {
      this.currentToolBehavior.moveUnactiveToolAt(
        coords.x,
        coords.y,
        currentFrame,
        this.overlayFrame,
        event
      );
    }
    $.publish(Events.CURSOR_MOVED, [coords.x, coords.y]);
  };

  ns.DrawingController.prototype.onMousewheel_ = function (jQueryEvent) {
    var evt = jQueryEvent.originalEvent;
    // Ratio between wheelDeltaY (mousewheel event) and deltaY (wheel event) is -40
    var delta;
    if (pskl.utils.UserAgent.isChrome) {
      delta = evt.wheelDeltaY;
    } else if (pskl.utils.UserAgent.isIE11) {
      delta = evt.wheelDelta;
    } else if (pskl.utils.UserAgent.isFirefox) {
      delta = -40 * evt.deltaY;
    }
    var modifier = Math.abs(delta / 120);

    if (pskl.utils.UserAgent.isMac ? evt.metaKey : evt.ctrlKey) {
      modifier = modifier * 5;
      // prevent default to prevent the default browser UI resize
      evt.preventDefault();
    }

    if (delta > 0) {
      this.increaseZoom_(modifier);
    } else if (delta < 0) {
      this.decreaseZoom_(modifier);
    }
  };

  ns.DrawingController.prototype.increaseZoom_ = function (zoomMultiplier) {
    var step = (zoomMultiplier || 1) * this.getZoomStep_();
    this.setZoom_(this.renderer.getZoom() + step);
  };

  ns.DrawingController.prototype.decreaseZoom_ = function (zoomMultiplier) {
    var step = (zoomMultiplier || 1) * this.getZoomStep_();
    this.setZoom_(this.renderer.getZoom() - step);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMouseup_ = function (event) {
    var frame = this.piskelController.getCurrentFrame();
    var coords = this.getSpriteCoordinates(event.clientX, event.clientY);
    if (event.changedTouches && event.changedTouches[0]) {
      coords = this.getSpriteCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
    if (this.isClicked) {
      // A mouse button was clicked on the drawing canvas before this mouseup event,
      // the user was probably drawing on the canvas.
      // Note: The mousemove movement (and the mouseup) may end up outside
      // of the drawing canvas.

      this.isClicked = false;

      if (pskl.app.mouseStateService.isMiddleButtonPressed()) {
        if (this.dragHandler.isDragging()) {
          this.dragHandler.stopDrag();
        } else if (frame.containsPixel(coords.x, coords.y)) {
          $.publish(Events.SELECT_PRIMARY_COLOR, [frame.getPixel(coords.x, coords.y)]);
        }
      } else {
        this.currentToolBehavior.releaseToolAt(
          coords.x,
          coords.y,
          this.piskelController.getCurrentFrame(),
          this.overlayFrame,
          event
        );

        $.publish(Events.TOOL_RELEASED);
      }
      $.publish(Events.MOUSE_EVENT, [event, this]);
    }
  };

  /**
   * Translate absolute x,y screen coordinates into sprite coordinates
   * @param  {Number} screenX
   * @param  {Number} screenY
   * @return {Object} {x:Number, y:Number}
   */
  ns.DrawingController.prototype.getSpriteCoordinates = function(screenX, screenY) {
    return this.renderer.getCoordinates(screenX, screenY);
  };

  ns.DrawingController.prototype.getScreenCoordinates = function(spriteX, spriteY) {
    return this.renderer.reverseCoordinates(spriteX, spriteY);
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

    if (pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN)) {
      this.onionSkinRenderer.render();
    }

    if (pskl.UserSettings.get(pskl.UserSettings.LAYER_PREVIEW)) {
      this.layersRenderer.render();
    }

    this.renderer.render(currentFrame);
    this.overlayRenderer.render(this.overlayFrame);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.calculateZoom_ = function() {
    var frameHeight = this.piskelController.getCurrentFrame().getHeight();
    var frameWidth = this.piskelController.getCurrentFrame().getWidth();

    return Math.min(this.getAvailableWidth_() / frameWidth, this.getAvailableHeight_() / frameHeight);
  };

  ns.DrawingController.prototype.getAvailableHeight_ = function () {
    return $('#main-wrapper').height();
  };

  ns.DrawingController.prototype.getAvailableWidth_ = function () {
    var leftSectionWidth = $('.left-column').outerWidth(true);
    var rightSectionWidth = $('.right-column').outerWidth(true);
    var toolsContainerWidth = $('#tool-section').outerWidth(true);
    var settingsContainerWidth = $('#application-action-section').outerWidth(true);

    var usedWidth = leftSectionWidth + rightSectionWidth + toolsContainerWidth + settingsContainerWidth;
    var availableWidth = $('#main-wrapper').width() - usedWidth;

    var comfortMargin = 10;
    return availableWidth - comfortMargin;
  };

  ns.DrawingController.prototype.getContainerHeight_ = function () {
    return this.getAvailableHeight_();
  };

  ns.DrawingController.prototype.getContainerWidth_ = function () {
    return this.getAvailableWidth_();
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

  ns.DrawingController.prototype.getOffset = function () {
    return this.compositeRenderer.getOffset();
  };

  ns.DrawingController.prototype.setOffset = function (x, y) {
    this.compositeRenderer.setOffset(x, y);
    $.publish(Events.ZOOM_CHANGED);
  };

  ns.DrawingController.prototype.resetZoom_ = function () {
    this.setZoom_(this.calculateZoom_());
  };

  ns.DrawingController.prototype.getZoomStep_ = function () {
    return Math.max(0.1, this.renderer.getZoom() / 15);
  };

  ns.DrawingController.prototype.setZoom_ = function (zoom) {
    this.compositeRenderer.setZoom(zoom);
    $.publish(Events.ZOOM_CHANGED);
  };

})();
