/*
 * @provide pskl.drawingtools.Circle
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Circle = function() {
		this.toolId = "tool-circle"
		
		// Circle's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.Circle, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Circle.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		
		// Drawing the first point of the rectangle in the fake overlay canvas:
		overlay.setPixel(col, row, color);
	};

	ns.Circle.prototype.moveToolAt = function(col, row, color, frame, overlay) {
		overlay.clear();

		// When the user moussemove (before releasing), we dynamically compute the 
		// pixel to draw the line and draw this line in the overlay :
		var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);
		if(color == Constants.TRANSPARENT_COLOR) {
			color = Constants.SELECTION_TRANSPARENT_COLOR;
		}

		// Drawing current stroke:
		for(var i = 0; i< strokePoints.length; i++) {
			overlay.setPixel(strokePoints[i].col, strokePoints[i].row, color);
		}
	};

	/**
	 * @override
	 */
	ns.Circle.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
		overlay.clear();
		// If the stroke tool is released outside of the canvas, we cancel the stroke: 
		if(frame.containsPixel(col, row)) {
			var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);
			for(var i = 0; i< strokePoints.length; i++) {
				// Change model:
				frame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
			}
			// The user released the tool to draw a line. We will compute the pixel coordinate, impact
			// the model and draw them in the drawing canvas (not the fake overlay anymore)		
		}
	};
})();
