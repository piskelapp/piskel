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
	ns.Eraser.prototype.applyToolOnFrameAt = function(col, row, frame, color) {
		frame[col][row] = Constants.TRANSPARENT_COLOR;
	};

	/**
	 * @override
	 */
	ns.Eraser.prototype.applyToolOnCanvasAt = function(col, row, canvas, frame, color, dpi) {

		this.drawPixelInCanvas(col, row, canvas, Constants.TRANSPARENT_COLOR, dpi);
	};

	/**
	 * @override
	 */
	ns.Eraser.prototype.releaseToolAt = function() {
		// Do nothing
		console.log('Eraser release');
	};
})();