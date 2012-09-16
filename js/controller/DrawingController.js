(function () {
  var ns = $.namespace("pskl.controller");
  ns.DrawingController = function (framesheet, container) {
    /**
     * @public
     */
    this.framesheet = framesheet;
    
    /**
     * @public
     */
    this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(framesheet.getCurrentFrame());

    /**
     * @private
     */
    this.container = container;

    // TODO(vincz): Store user prefs in a localstorage string ?
    var renderingOptions = {
      "dpi": this.calculateDPI_(),
      "hasGrid" : true
    };
    
    this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, "drawing-canvas");
    this.overlayRenderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, "canvas-overlay");
    
    this.renderer.init(framesheet.getCurrentFrame());
    this.overlayRenderer.init(this.overlayFrame);

    // State of drawing controller:
    this.isClicked = false;
    this.isRightClicked = false;
    this.previousMousemoveTime = 0;
    this.currentToolBehavior = null;
    this.primaryColor =  Constants.DEFAULT_PEN_COLOR;
    this.secondaryColor =  Constants.TRANSPARENT_COLOR;

    this.initMouseBehavior();

    $.subscribe(Events.TOOL_SELECTED, $.proxy(function(evt, toolBehavior) {
      console.log("Tool selected: ", toolBehavior);
      this.currentToolBehavior = toolBehavior;
    }, this));

    $.subscribe(Events.COLOR_SELECTED, $.proxy(function(evt, color, isPrimary) {
      console.log("Color selected: ", color);
      if (isPrimary) {
        this.primaryColor = color;
      } else {
        this.secondaryColor = color;
      }
    }, this));

    $(window).resize($.proxy(this.startDPIUpdateTimer_, this));

    $.subscribe(Events.FRAME_SIZE_CHANGED, $.proxy(this.updateDPI_, this));
     $.subscribe(Events.GRID_DISPLAY_STATE_CHANGED, $.proxy(this.forceRendering_, this)); 
  };

  ns.DrawingController.prototype.initMouseBehavior = function() {
    var body = $('body');
        this.container.mousedown($.proxy(this.onMousedown_, this));
        this.container.mousemove($.proxy(this.onMousemove_, this));
        body.mouseup($.proxy(this.onMouseup_, this));
        
        // Deactivate right click:
        body.contextmenu(this.onCanvasContextMenu_);
  };



  ns.DrawingController.prototype.startDPIUpdateTimer_ = function () {
      if (this.dpiUpdateTimer) window.clearInterval(this.dpiUpdateTimer);
      this.dpiUpdateTimer = window.setTimeout($.proxy(this.updateDPI_, this), 200);
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
        this.framesheet.getCurrentFrame(),
        this.overlayFrame
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
            this.framesheet.getCurrentFrame(),
            this.overlayFrame
          );
      
          // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
          // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
          // you don't need to draw anything when mousemoving and you request useless localStorage.
          $.publish(Events.LOCALSTORAGE_REQUEST);
        } else {

          this.currentToolBehavior.moveUnactiveToolAt(
            coords.col, coords.row,
            this.getCurrentColor_(),
            this.framesheet.getCurrentFrame(),
            this.overlayFrame
          );
        }
        this.previousMousemoveTime = currentTime;
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
          this.framesheet.getCurrentFrame(),
          this.overlayFrame
        );

        $.publish(Events.TOOL_RELEASED);
      }
    },

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
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    };

  ns.DrawingController.prototype.render = function () {
    this.renderFrame();
    this.renderOverlay();
  };

  ns.DrawingController.prototype.renderFrame = function () {
    var frame = this.framesheet.getCurrentFrame();
    console.log("render", frame.getHeight());
    if (frame.getHeight() == 32) debugger;
    var serializedFrame = frame.serialize();
    if (this.serializedFrame != serializedFrame) {
      this.serializedFrame = serializedFrame;
      this.renderer.render(frame);
    }
  };

  ns.DrawingController.prototype.renderOverlay = function () {
    var serializedOverlay = this.overlayFrame.serialize();
    if (this.serializedOverlay != serializedOverlay) {
      this.serializedOverlay = serializedOverlay;
      this.overlayRenderer.render(this.overlayFrame);
    }
  };

  ns.DrawingController.prototype.forceRendering_ = function () {
    this.serializedFrame = this.serializedOverlay = null;
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.calculateDPI_ = function() {
    var userMessageGap = 80; // Reserve some height to show the user message at the bottom

    var availableViewportHeight = $('.main-panel').height() - userMessageGap,
        availableViewportWidth = $('.main-panel').width(),
        previewHeight = $(".preview-container").height(),
        previewWidth = $(".preview-container").width(),
        framePixelHeight = this.framesheet.getCurrentFrame().getHeight(),
        framePixelWidth = this.framesheet.getCurrentFrame().getWidth();
    var dpi = pskl.PixelUtils.calculateDPI(availableViewportHeight, availableViewportWidth, framePixelHeight, framePixelWidth);

    var drawingCanvasHeight = dpi * framePixelHeight;
    var drawingCanvasWidth = dpi * framePixelWidth;

    // Check if preview and drawing canvas overlap
    var heightGap =  drawingCanvasHeight + previewHeight - availableViewportHeight,
        widthGap = drawingCanvasWidth + previewWidth - availableViewportWidth;
    if (heightGap > 0 && widthGap > 0) {
        // Calculate the DPI change needed to bridge height and width gap
        var gapDPI = pskl.PixelUtils.calculateDPI(heightGap, widthGap, framePixelHeight, framePixelWidth);
        // substract gap dpi to initial dpi
        dpi -= (gapDPI - 1);
    }
    return dpi;
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.updateDPI_ = function() {
    var dpi = this.calculateDPI_();
    console.log("dpi", dpi);
    this.renderer.updateDPI(dpi);
    this.overlayRenderer.updateDPI(dpi);
    this.forceRendering_();
  };
})();