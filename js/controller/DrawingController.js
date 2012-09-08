(function () {
	var ns = $.namespace("pskl.controller");
	ns.DrawingController = function (frame, container, dpi) {
		this.dpi = dpi;

		// TODO(vincz): Store user prefs in a localstorage string ?
		var renderingOptions = {
			"dpi": dpi,
			"hasGrid" : true
		};

		/**
		 * @public
		 */
		this.frame = frame;
		
		/**
		 * @public
		 */
		this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(frame);

		/**
		 * @private
		 */
		this.container = container;
		
		this.renderer = new pskl.rendering.FrameRenderer(
			this.container,
			renderingOptions,
			"drawing-canvas");

		this.overlayRenderer = new pskl.rendering.FrameRenderer(
			this.container,
			renderingOptions,
			"canvas-overlay");
		
		this.renderer.init(this.frame);
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
	};

	ns.DrawingController.prototype.initMouseBehavior = function() {
		var body = $('body');
        this.container.mousedown($.proxy(this.onMousedown_, this));
        this.container.mousemove($.proxy(this.onMousemove_, this));
        body.mouseup($.proxy(this.onMouseup_, this));
        
        // Deactivate right click:
        this.container.contextmenu(this.onCanvasContextMenu_);
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

      var spriteCoordinate = this.getSpriteCoordinate(event);
      //console.log("mousedown: col: " + spriteCoordinate.col + " - row: " + spriteCoordinate.row);
      
      this.currentToolBehavior.applyToolAt(
        spriteCoordinate.col,
        spriteCoordinate.row,
        this.getCurrentColor_(),
        this
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
        var spriteCoordinate = this.getSpriteCoordinate(event);
        if (this.isClicked) {
       
          this.currentToolBehavior.moveToolAt(
            spriteCoordinate.col,
            spriteCoordinate.row,
            this.getCurrentColor_(),
            this
          );
		  
          //console.log("mousemove: col: " + spriteCoordinate.col + " - row: " + spriteCoordinate.row);
      
          // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
          // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
          // you don't need to draw anything when mousemoving and you request useless localStorage.
          $.publish(Events.LOCALSTORAGE_REQUEST);
        } else {
            // debug mode to see the selected pixel
            // this.clearOverlay();
            // this.overlayFrame.setPixel( spriteCoordinate.col,spriteCoordinate.row, "#ff0000");
            // this.renderOverlay();
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
        if(this.isRightClicked) {
          $.publish(Events.CANVAS_RIGHT_CLICK_RELEASED);
        }


        this.isClicked = false;
        this.isRightClicked = false;
        var spriteCoordinate = this.getSpriteCoordinate(event);
        //console.log("mousemove: col: " + spriteCoordinate.col + " - row: " + spriteCoordinate.row);
        this.currentToolBehavior.releaseToolAt(
          spriteCoordinate.col,
          spriteCoordinate.row,
          this.getCurrentColor_(),
          this
        );

        $.publish(Events.TOOL_RELEASED);

        // TODO: Remove that when we have the centralized redraw loop
        $.publish(Events.REDRAW_PREVIEWFILM);
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
    ns.DrawingController.prototype.getSpriteCoordinate = function(event) {
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
	
	ns.DrawingController.prototype.updateDPI = function (newDPI) {
		this.renderer.updateDPI(newDPI);
		this.overlayRenderer.updateDPI(newDPI);

		this.renderer.render(this.frame);
		this.overlayRenderer.render(this.overlayFrame);
	};

  ns.DrawingController.prototype.render = function () {
    try {

      this.renderFrame();
      this.renderOverlay();
    } catch (e) {
      // TODO : temporary t/c for integration
    }
  };

	ns.DrawingController.prototype.renderFrame = function () {
    var serializedFrame = this.frame.serialize();
    if (this.serializedFrame != serializedFrame) {
      this.serializedFrame = serializedFrame
		  this.renderer.render(this.frame);
    }
	};

	ns.DrawingController.prototype.renderFramePixel = function (col, row) {
		this.renderer.drawPixel(col, row, this.frame);
	};

	ns.DrawingController.prototype.renderOverlay = function () {
    var serializedOverlay = this.overlayFrame.serialize();
    if (this.serializedOverlay != serializedOverlay) {
      this.serializedOverlay = serializedOverlay
      this.renderer.render(this.overlayFrame);
    }
	};

	ns.DrawingController.prototype.clearOverlay = function () {
		this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(this.frame);
		this.overlayRenderer.clear();
	};
})();