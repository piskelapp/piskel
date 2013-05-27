/*
 * @provide pskl.drawingtools.Move
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Move = function() {
		this.toolId = "tool-move";
		this.helpText = "Move tool";
		
		// Stroke's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.Move, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Move.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		this.frameClone = frame.clone();
	};

	ns.Move.prototype.moveToolAt = function(col, row, color, frame, overlay) {	
		var colDiff = col - this.startCol, rowDiff = row - this.startRow;
		this.shiftFrame(colDiff, rowDiff, frame, this.frameClone);
	};

	ns.Move.prototype.shiftFrame = function (colDiff, rowDiff, frame, reference) {
		var color;
		for (var col = 0 ; col < frame.getWidth() ; col++) {
			for (var row = 0 ; row < frame.getHeight() ; row++) {
				if (reference.containsPixel(col - colDiff, row - rowDiff)) {
					color = reference.getPixel(col - colDiff, row - rowDiff);
				} else {
					color = Constants.TRANSPARENT_COLOR;
				}
				frame.setPixel(col, row, color);
			}
		}
	};

	/**
	 * @override
	 */
	ns.Move.prototype.releaseToolAt = function(col, row, color, frame, overlay) {
		this.moveToolAt(col, row, color, frame, overlay);
	};
})();
