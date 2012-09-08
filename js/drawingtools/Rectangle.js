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
	};

	pskl.utils.inherit(ns.Rectangle, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Rectangle.prototype.applyToolAt = function(col, row, color, drawer) {
		this.startCol = col;
		this.startRow = row;
		
		// Drawing the first point of the rectangle in the fake overlay canvas:
		drawer.overlayFrame.setPixel(col, row, color);
		drawer.renderOverlay();
	};

	ns.Rectangle.prototype.moveToolAt = function(col, row, color, drawer) {
		// Clean overlay canvas:
		drawer.clearOverlay();

		// When the user moussemove (before releasing), we dynamically compute the 
		// pixel to draw the line and draw this line in the overlay :
		var strokePoints = this.getRectanglePixels_(this.startCol, col, this.startRow, row);
		
		// Drawing current stroke:
		for(var i = 0; i< strokePoints.length; i++) {

			if(color == Constants.TRANSPARENT_COLOR) {
				color = Constants.SELECTION_TRANSPARENT_COLOR;
			}			
			drawer.overlayFrame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
		}
		drawer.renderOverlay();
	};

	/**
	 * @override
	 */
	ns.Rectangle.prototype.releaseToolAt = function(col, row, color, drawer) {		
		// If the stroke tool is released outside of the canvas, we cancel the stroke: 
		if(drawer.frame.containsPixel(col, row)) {
			var strokePoints = this.getRectanglePixels_(this.startCol, col, this.startRow, row);
			for(var i = 0; i< strokePoints.length; i++) {
				// Change model:
				drawer.frame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
			}
			// The user released the tool to draw a line. We will compute the pixel coordinate, impact
			// the model and draw them in the drawing canvas (not the fake overlay anymore)
			// Draw in canvas:
			// TODO: Remove that when we have the centralized redraw loop
			drawer.renderFrame();		
		}
		drawer.clearOverlay();
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
