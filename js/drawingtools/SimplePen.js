/*
 * @provide pskl.drawingtools.SimplePen
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.SimplePen = function() {
		this.toolId = "tool-pen"
	};

	pskl.utils.inherit(ns.SimplePen, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.SimplePen.prototype.applyToolOnFrameAt = function(col, row, frame, color) {
		var color = pskl.utils.normalizeColor(color);
	    if (color != frame[col][row]) {
	        frame[col][row] = color;
	    }
	};

	/**
	 * @override
	 */
	ns.SimplePen.prototype.applyToolOnCanvasAt = function(col, row, canvas, frame, color, dpi) {

		this.drawPixelInCanvas(col, row, canvas, color, dpi);
	};

	/**
	 * @override
	 */
	ns.SimplePen.prototype.releaseToolAt = function() {
		// Do nothing
		console.log('SimplePen release');
	};

})();
