/*
 * @provide pskl.drawingtools.Eraser
 *
 * @require Constants
 * @require pskl.utils
 */
 (function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Eraser = function() {
		this.toolId = "tool-eraser";
	};

	pskl.utils.inherit(ns.Eraser, ns.BaseTool);

	/**
	 * @override
	 */
	ns.Eraser.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {
		
		// Change model:
		frame[col][row] = Constants.TRANSPARENT_COLOR;

		// Draw on canvas:
		// TODO: Remove that when we have the centralized redraw loop
		this.drawPixelInCanvas(col, row, canvas, Constants.TRANSPARENT_COLOR, dpi);
	};

	/**
	 * @override
	 */
	ns.Eraser.prototype.moveToolAt = function(col, row, frame, color, canvas, dpi) {
		this.applyToolAt(col, row, frame, color, canvas, dpi);
	};

})();