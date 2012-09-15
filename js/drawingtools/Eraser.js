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
		this.helpText = "Eraser tool";
	};

	pskl.utils.inherit(ns.Eraser, ns.SimplePen);

	/**
	 * @override
	 */
	ns.Eraser.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.superclass.applyToolAt.call(this, col, row, Constants.TRANSPARENT_COLOR, frame, overlay);
	};
})();