/*
 * @provide pskl.drawingtools.Rectangle
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Rectangle = function() {
		this.toolId = "tool-rectangle"
		
		// Rectangle's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
		// Rectangle's second point coordinates (changing dynamically in moveToolAt)
		this.endCol = null;
		this.endRow = null;
		
		this.canvasOverlay = null;
	};

	pskl.utils.inherit(ns.Rectangle, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Rectangle.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {
		this.startCol = col;
		this.startRow = row;
		
		// The fake canvas where we will draw the preview of the rectangle:
		this.canvasOverlay = this.createCanvasOverlay(canvas);
		// Drawing the first point of the rectangle in the fake overlay canvas:
		this.drawPixelInCanvas(col, row, this.canvasOverlay, color, dpi);
	};

	ns.Rectangle.prototype.moveToolAt = function(col, row, frame, color, canvas, dpi) {
		this.endCol = col;
		this.endRow = row;
		// When the user moussemove (before releasing), we dynamically compute the 
		// pixel to draw the line and draw this line in the overlay canvas:
		var strokePoints = this.getRectanglePixels_(this.startCol, this.endCol, this.startRow, this.endRow);

		// Clean overlay canvas:
		this.canvasOverlay.getContext("2d").clearRect(
			0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
		
		// Drawing current stroke:
		for(var i = 0; i< strokePoints.length; i++) {

			if(color == Constants.TRANSPARENT_COLOR) {
				color = "rgba(255, 255, 255, 0.6)";
			}			
			this.drawPixelInCanvas(strokePoints[i].col, strokePoints[i].row, this.canvasOverlay, color, dpi);
		}
	};

	/**
	 * @override
	 */
	ns.Rectangle.prototype.releaseToolAt = function(col, row, frame, color, canvas, dpi) {
		this.endCol = col;
		this.endRow = row;
		
		// If the stroke tool is released outside of the canvas, we cancel the stroke: 
		// TODO: Mutualize this check in common method
		if(col < 0 || row < 0 || col > frame.length || row > frame[0].length) {
			this.removeCanvasOverlays();
			return;
		}

		// The user released the tool to draw a line. We will compute the pixel coordinate, impact
		// the model and draw them in the drawing canvas (not the fake overlay anymore)
		var strokePoints = this.getRectanglePixels_(this.startCol, this.endCol, this.startRow, this.endRow);

		for(var i = 0; i< strokePoints.length; i++) {
			// Change model:
			frame[strokePoints[i].col][strokePoints[i].row] = color;
			
			// Draw in canvas:
			// TODO: Remove that when we have the centralized redraw loop
			this.drawPixelInCanvas(strokePoints[i].col, strokePoints[i].row, canvas, color, dpi);		
		}
		
		// For now, we are done with the stroke tool and don't need an overlay anymore:
		this.removeCanvasOverlays();

		// TODO: Create a afterRelease event hook or put that deep in the model
		$.publish(Events.FRAMESHEET_UPDATED);   
	};

	/**
	 * Get an array of pixels representing the rectangle.
	 *
	 * @private
	 */
	ns.Rectangle.prototype.getRectanglePixels_ = function(x0, x1, y0, y1) {
		
		var pixels = [];
		var swap;
		
		if(x0 > x1) {
			swap = x0;
			x0 = x1;
			x1 = swap;
		}
		if(y0 > y1) {
			swap = y0;
			y0 = y1;
			y1 = swap;
		}

		// Creating horizontal sides of the rectangle:
		for(var x = x0; x <= x1; x++) {
			pixels.push({"col": x, "row": y0});
			pixels.push({"col": x, "row": y1});
		}

		// Creating vertical sides of the rectangle:
		for(var y = y0; y <= y1; y++) {
			pixels.push({"col": x0, "row": y});
			pixels.push({"col": x1, "row": y});	
		}
		
		return pixels;
     };

})();
