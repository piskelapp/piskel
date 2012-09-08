(function () {
	var ns = $.namespace("pskl.rendering");

	
	ns.FrameRenderer = function (container, renderingOptions, className) {
		
		this.defaultRenderingOptions = {
			"hasGrid" : false
		};
		renderingOptions = $.extend(true, {}, this.defaultRenderingOptions, renderingOptions);

		if(container == undefined) {
			throw "Bad FrameRenderer initialization. <container> undefined.";
		}
		
		if(isNaN(renderingOptions.dpi)) {
			throw "Bad FrameRenderer initialization. <dpi> not well defined.";
		}

		this.container = container;
		this.dpi = renderingOptions.dpi;
		this.className = className;
		this.canvas = null;
		this.hasGrid = renderingOptions.hasGrid;
		this.gridStrokeWidth = 0;
		
		this.lastRenderedFrame = null;

		// Flag to know if the config was altered
		this.canvasConfigDirty = true;

		if(this.hasGrid) {
			$.subscribe(Events.GRID_DISPLAY_STATE_CHANGED, $.proxy(this.showGrid, this));	
		}	
	};

	ns.FrameRenderer.prototype.init = function (frame) {
		this.render(frame);
		this.lastRenderedFrame = frame;
	};

	ns.FrameRenderer.prototype.updateDPI = function (newDPI) {
		this.dpi = newDPI;
		this.canvasConfigDirty = true;
	};

	ns.FrameRenderer.prototype.showGrid = function (evt, show) {
		
		this.gridStrokeWidth = 0;
		if(show) {
			this.gridStrokeWidth = Constants.GRID_STROKE_WIDTH;
		}
		
		this.canvasConfigDirty = true;

		if(this.lastRenderedFrame) {
			this.render(this.lastRenderedFrame);
		}
	};

	ns.FrameRenderer.prototype.render = function (frame) {
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				this.drawPixel(col, row, frame, this.getCanvas_(frame, col, row), this.dpi);
			}
		}
		this.lastRenderedFrame = frame;
	};

	ns.FrameRenderer.prototype.drawPixel = function (col, row, frame) {
		var context = this.getCanvas_(frame, col, row).getContext('2d');
		var color = frame.getPixel(col, row);
		if(color == Constants.TRANSPARENT_COLOR) {
			context.clearRect(this.getFrameY_(col), this.getFrameY_(row), this.dpi, this.dpi);   
		} 
		else {
			if(color != Constants.SELECTION_TRANSPARENT_COLOR) {
				// TODO(vincz): Found a better design to update the palette, it's called too frequently.
				$.publish(Events.COLOR_USED, [color]);
			}
			context.fillStyle = color;
			context.fillRect(this.getFrameY_(col), this.getFrameY_(row), this.dpi, this.dpi);
		}
		this.lastRenderedFrame = frame;
	};

	ns.FrameRenderer.prototype.clear = function (col, row, frame) {
		var canvas = this.getCanvas_(frame, col, row)
		canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
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
	ns.FrameRenderer.prototype.getFrameX_ = function(col) {
		return col * this.dpi + ((col - 1) * this.gridStrokeWidth);
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.getFrameY_ = function(row) {
		return row * this.dpi + ((row - 1) * this.gridStrokeWidth);
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.drawGrid_ = function(canvas, width, height, col, row) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = Constants.GRID_STROKE_WIDTH;
		ctx.strokeStyle = Constants.GRID_STROKE_COLOR;
		for(var c=1; c < col; c++) {			
	        ctx.moveTo(this.getFrameX_(c), 0);
	        ctx.lineTo(this.getFrameX_(c), height);
	        ctx.stroke();
		}
		
		for(var r=1; r < row; r++) {
	        ctx.moveTo(0, this.getFrameY_(r));
	        ctx.lineTo(width, this.getFrameY_(r));
	        ctx.stroke();
		}
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.getCanvas_ = function (frame) {
		if(this.canvasConfigDirty) {
			$(this.canvas).remove();
			
			var col = frame.getWidth(),
				row = frame.getHeight();
			
			var canvas = document.createElement("canvas");
			
			var pixelWidth =  col * this.dpi + this.gridStrokeWidth * (col - 1);
			var pixelHeight =  row * this.dpi + this.gridStrokeWidth * (row - 1);
			canvas.setAttribute("width", pixelWidth);
			canvas.setAttribute("height", pixelHeight);
			var canvasClassname =  "canvas";
			if(this.className) {
				canvasClassname += " " + this.className;	
			}
			canvas.setAttribute("class", canvasClassname);
			this.container.append(canvas);

			if(this.gridStrokeWidth > 0) {
				this.drawGrid_(canvas, pixelWidth, pixelHeight, col, row);
			}
			
				
			this.canvas = canvas;
			this.canvasConfigDirty = false;
		}
		return this.canvas;
	};
})();