/*
 * @provide pskl.drawingtools.Rectangle
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Rectangle = function() {
		this.toolId = "tool-rectangle";
		this.helpText = "Rectangle tool";
		
		// Rectangle's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.Rectangle, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Rectangle.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		
		// Drawing the first point of the rectangle in the fake overlay canvas:
		overlay.setPixel(col, row, color);
	};

	ns.Rectangle.prototype.moveToolAt = function(col, row, color, frame, overlay) {
		overlay.clear();
		if(color == Constants.TRANSPARENT_COLOR) {
			color = Constants.SELECTION_TRANSPARENT_COLOR;
		}

		// draw in overlay
		this.drawRectangle_(col, row, color, overlay);
	};

	/**
	 * @override
	 */
	ns.Rectangle.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
		overlay.clear();
		if(frame.containsPixel(col, row)) { // cancel if outside of canvas
			// draw in frame to finalize
			this.drawRectangle_(col, row, color, frame);
		}
	};

	ns.Rectangle.prototype.drawRectangle_ = function (col, row, color, targetFrame) {
		var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);
		for(var i = 0; i< strokePoints.length; i++) {
			// Change model:
			targetFrame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
		}
	};
})();
