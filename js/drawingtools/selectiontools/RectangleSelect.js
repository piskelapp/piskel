/*
 * @provide pskl.drawingtools.RectangleSelect
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.RectangleSelect = function() {
		this.toolId = "tool-rectangle-select";
		
		ns.BaseSelect.call(this);
	};

	pskl.utils.inherit(ns.RectangleSelect, ns.BaseSelect);
	
	/**
	 * @override
	 */
	ns.RectangleSelect.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		
		this.lastCol = col;
		this.lastRow = row;
		
		// TODO(vincz): Comment here nasty vince
		if(overlay.getPixel(col, row) != Constants.SELECTION_TRANSPARENT_COLOR) {
			this.mode = "select";

			// Drawing the first point of the rectangle in the fake overlay canvas:
			overlay.setPixel(col, row, color);
		}
		else {
			this.mode = "moveSelection";

			this.overlayFrameReference = overlay.clone();
		}
	};

	ns.RectangleSelect.prototype.moveToolAt = function(col, row, color, frame, overlay) {
		if(this.mode == "select") {
			// Clean overlay canvas:
			overlay.clear();

			// When the user moussemove (before releasing), we dynamically compute the 
			// pixel to draw the line and draw this line in the overlay :
			var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);
			
			color = Constants.SELECTION_TRANSPARENT_COLOR;
			// Drawing current stroke:
			for(var i = 0; i< strokePoints.length; i++) {
				overlay.setPixel(strokePoints[i].col, strokePoints[i].row, color);
			}
		}
		else if(this.mode == "moveSelection") {
			
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
	ns.RectangleSelect.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
		if(this.mode == "select") {
			overlay.clear();
			if(this.startCol == col &&this.startRow == row) {
				$.publish(Events.SELECTION_DISMISSED);
			} else {
				var selection = new pskl.selection.RectangularSelection(
					this.startCol, this.startRow, col, row);
				$.publish(Events.SELECTION_CREATED, [selection]);
			}
		} else if(this.mode == "moveSelection") {
			this.moveToolAt(col, row, color, frame, overlay);
		}
	};
})();
