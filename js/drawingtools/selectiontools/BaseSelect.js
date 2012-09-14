/*
 * @provide pskl.drawingtools.BaseSelect
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.BaseSelect = function() {
		this.secondaryToolId = "tool-move";
		this.BodyRoot = $('body');
		
		// Select's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.BaseSelect, ns.BaseTool);

	/**
	 * @override
	 */
	ns.BaseSelect.prototype.moveUnactiveToolAt = function(col, row, color, frame, overlay) {
		
		// If we mouseover the selection draw inside the overlay frame, show the 'move' cursor
		// instead of the 'select' one. It indicates that we can move the selection by dragndroping it.
		if(overlay.getPixel(col, row) != Constants.SELECTION_TRANSPARENT_COLOR) {
			this.BodyRoot.addClass(this.toolId);
			this.BodyRoot.removeClass(this.secondaryToolId);
		} else {
			this.BodyRoot.addClass(this.secondaryToolId);
			this.BodyRoot.removeClass(this.toolId);
		}
	};

	/**
	 * Move the overlay frame filled with semi-transparent pixels that represent the selection
	 * @private
	 */
	ns.BaseSelect.prototype.shiftOverlayFrame_ = function (colDiff, rowDiff, overlayFrame, reference) {
		var color;
		for (var col = 0 ; col < overlayFrame.getWidth() ; col++) {
			for (var row = 0 ; row < overlayFrame.getHeight() ; row++) {
				if (reference.containsPixel(col - colDiff, row - rowDiff)) {
					color = reference.getPixel(col - colDiff, row - rowDiff);
				} else {
					color = Constants.TRANSPARENT_COLOR;
				}
				overlayFrame.setPixel(col, row, color)
			}
		}
	};
})();
