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
	ns.SimplePen.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {
		
		// Change model:
		var color = pskl.utils.normalizeColor(color);
	    if (color != frame[col][row]) {
	        frame[col][row] = color;
	    }

	    // Draw on canvas:
	    // TODO: Remove that when we have the centralized redraw loop
	    this.drawPixelInCanvas(col, row, canvas, color, dpi);
	};

	ns.SimplePen.prototype.moveToolAt = function(col, row, frame, color, canvas, dpi) {
		this.applyToolAt(col, row, frame, color, canvas, dpi);
	};
})();
