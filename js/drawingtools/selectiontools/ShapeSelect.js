/*
 * @provide pskl.drawingtools.ShapeSelect
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.ShapeSelect = function() {
		this.toolId = "tool-shape-select";
		
		ns.BaseSelect.call(this);
	};

	pskl.utils.inherit(ns.ShapeSelect, ns.BaseSelect);
	
	/**
	 * @override
	 */
	ns.ShapeSelect.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		
		this.lastCol = col;
		this.lastRow = row;
		
		// TODO(vincz): Comment here nasty vince
		if(overlay.getPixel(col, row) != Constants.SELECTION_TRANSPARENT_COLOR) {
			this.mode = "select";

			$.publish(Events.SELECTION_DISMISSED);
			var pixels = pskl.PixelUtils.getSimilarConnectedPixelsFromFrame(frame, col, row);
			var selection = new pskl.selection.ShapeSelection(pixels);
			$.publish(Events.SELECTION_CREATED, [selection]);
		}
		else {
			this.mode = "moveSelection";

			this.overlayFrameReference = overlay.clone();
		}
	};

	ns.ShapeSelect.prototype.moveToolAt = function(col, row, color, frame, overlay) {
		if(this.mode == "moveSelection") {
			
			// TODO(vincz): Comment here nasty vince
			var deltaCol = col - this.lastCol;
			var deltaRow = row - this.lastRow;
			
			console.log(deltaCol)
			console.log(deltaRow)
			var colDiff = col - this.startCol, rowDiff = row - this.startRow;
			if (colDiff != 0 || rowDiff != 0) {
				// Update selection on overlay frame:
				this.shiftOverlayFrame_(colDiff, rowDiff, overlay, this.overlayFrameReference);

				// Update selection model:
				$.publish(Events.SELECTION_MOVE_REQUEST, [deltaCol, deltaRow]);
			}
			this.lastCol = col;
			this.lastRow = row;		
		}
	};

	/**
	 * @override
	 */
	ns.ShapeSelect.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
		if(this.mode == "select") {
		  // TODO(vincz): define a way to dismiss the shape select
		} else if(this.mode == "moveSelection") {
			this.moveToolAt(col, row, color, frame, overlay);
		}
	};
})();
