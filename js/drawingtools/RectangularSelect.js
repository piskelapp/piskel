/*
 * @provide pskl.drawingtools.Select
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Select = function() {
		this.toolId = "tool-select"
		
		// Select's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.Select, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Select.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		
		// Drawing the first point of the rectangle in the fake overlay canvas:
		overlay.setPixel(col, row, color);
	};

	ns.Select.prototype.moveToolAt = function(col, row, color, frame, overlay) {
		// Clean overlay canvas:
		overlay.clear();

		// When the user moussemove (before releasing), we dynamically compute the 
		// pixel to draw the line and draw this line in the overlay :
		var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);
		
		color = Constants.SELECTION_TRANSPARENT_COLOR;
		// Drawing current stroke:
		for(var i = 0; i< strokePoints.length; i++) {
			overlay.setPixel(strokePoints[i].col, strokePoints[i].row, color);
		}
	};

	/**
	 * @override
	 */
	ns.Select.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
		overlay.clear();
		
		var selection = new pskl.selection.RectangularSelection(
			this.startCol, this.startRow, col, row);
		$.publish(Events.SELECTION_CREATED, [selection]);
	};
})();
