/*
 * @provide pskl.drawingtools.PaintBucket
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.PaintBucket = function() {
		this.toolId = "tool-paint-bucket";
		this.helpText = "Paint bucket tool";
	};

	pskl.utils.inherit(ns.PaintBucket, ns.BaseTool);

	/**
	 * @override
	 */
	ns.PaintBucket.prototype.applyToolAt = function(col, row, color, frame, overlay) {

		pskl.PixelUtils.paintSimilarConnectedPixelsFromFrame(frame, col, row, color);
	};
})();













