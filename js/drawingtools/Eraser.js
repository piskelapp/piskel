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

	pskl.utils.inherit(ns.Eraser, ns.SimplePen);

	/**
	 * @override
	 */
	ns.Eraser.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {
		this.superclass.applyToolAt.call(this, col, row, frame, Constants.TRANSPARENT_COLOR, canvas, dpi);
	};
})();