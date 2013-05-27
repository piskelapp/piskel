/*
 * @provide pskl.drawingtools.RectangleSelect
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.RectangleSelect = function() {
		this.toolId = "tool-rectangle-select";
		this.helpText = "Rectangle selection tool";
		
		ns.BaseSelect.call(this);
	};

	pskl.utils.inherit(ns.RectangleSelect, ns.BaseSelect);
	

	/**
	 * @override
	 */
	ns.RectangleSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {
		// Drawing the first point of the rectangle in the fake overlay canvas:
		overlay.setPixel(col, row, color);
	};

	/**
	 * When creating the rectangle selection, we clear the current overlayFrame and
	 * redraw the current rectangle based on the orgin coordinate and
	 * the current mouse coordiinate in sprite.
	 * @override
	 */
	ns.RectangleSelect.prototype.onSelect_ = function (col, row, color, frame, overlay) {
		overlay.clear();
		if(this.startCol == col &&this.startRow == row) {
			$.publish(Events.SELECTION_DISMISSED);
		} else {
			var selection = new pskl.selection.RectangularSelection(
				this.startCol, this.startRow, col, row);
			$.publish(Events.SELECTION_CREATED, [selection]);
		}
	};

	/**
	 * @override
	 */
	ns.RectangleSelect.prototype.onSelectEnd_ = function (col, row, color, frame, overlay) {
		this.onSelect_(col, row, color, frame, overlay);
	};

})();
