/*
 * @provide pskl.drawingtools.Select
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Select = function() {
		this.toolId = "tool-select";
		this.secondaryToolId = "tool-move";
		this.BodyRoot = $('body');
		
		// Select's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.Select, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Select.prototype.applyToolAt = function(col, row, color, frame, overlay) {
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

	ns.Select.prototype.moveToolAt = function(col, row, color, frame, overlay) {
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

	// TODO(vincz): Comment here nasty vince
	ns.Select.prototype.moveUnactiveToolAt = function(col, row, color, frame, overlay) {
		
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
	 * @override
	 */
	ns.Select.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
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

	/**
	 * @private
	 */
	ns.Select.prototype.shiftOverlayFrame_ = function (colDiff, rowDiff, overlayFrame, reference) {
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
