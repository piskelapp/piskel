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
	ns.BaseSelect.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.startCol = col;
		this.startRow = row;
		
		this.lastCol = col;
		this.lastRow = row;
		
		// The select tool can be in two different state.
		// If the inital click of the tool is not on a selection, we go in "select"
		// mode to create a selection.
		// If the initial click is on a previous selection, we go in "moveSelection"
		// mode to allow to move the selection by drag'n dropping it.
		if(overlay.getPixel(col, row) != Constants.SELECTION_TRANSPARENT_COLOR) {
			
			this.mode = "select";
			this.onSelectStart_(col, row, color, frame, overlay);
		}
		else {

			this.mode = "moveSelection";
			this.onSelectionDragStart_(col, row, color, frame, overlay);
		}
	};

	/**
	 * @override
	 */
	ns.BaseSelect.prototype.moveToolAt = function(col, row, color, frame, overlay) {
		if(this.mode == "select") {
			
			this.onSelect_(col, row, color, frame, overlay);
		}
		else if(this.mode == "moveSelection") {
			
			this.onSelectionDrag_(col, row, color, frame, overlay);
		}
	};

	/**
	 * @override
	 */
	ns.BaseSelect.prototype.releaseToolAt = function(col, row, color, frame, overlay) {		
		if(this.mode == "select") {
			
			this.onSelectEnd_(col, row, color, frame, overlay);
		} else if(this.mode == "moveSelection") {
			
			this.onSelectionDragEnd_(col, row, color, frame, overlay);
		}
	};


	/**
	 * If we mouseover the selection draw inside the overlay frame, show the 'move' cursor
	 * instead of the 'select' one. It indicates that we can move the selection by dragndroping it.
	 * @override
	 */
	ns.BaseSelect.prototype.moveUnactiveToolAt = function(col, row, color, frame, overlay) {
		
		if(overlay.getPixel(col, row) != Constants.SELECTION_TRANSPARENT_COLOR) {
			// We're hovering the selection, show the move tool:
			this.BodyRoot.addClass(this.toolId);
			this.BodyRoot.removeClass(this.secondaryToolId);
		} else {
			// We're not hovering the selection, show create selection tool:
			this.BodyRoot.addClass(this.secondaryToolId);
			this.BodyRoot.removeClass(this.toolId);
		}
	};

	/**
	 * Move the overlay frame filled with semi-transparent pixels that represent the selection.
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
				overlayFrame.setPixel(col, row, color);
			}
		}
	};


	// The list of callbacks to implement by specialized tools to implement the selection creation behavior.
	/** @protected */
	ns.BaseSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {};
	/** @protected */
	ns.BaseSelect.prototype.onSelect_ = function (col, row, color, frame, overlay) {};
	/** @protected */
	ns.BaseSelect.prototype.onSelectEnd_ = function (col, row, color, frame, overlay) {};


	// The list of callbacks that define the drag'n drop behavior of the selection.
	/** @private */
	ns.BaseSelect.prototype.onSelectionDragStart_ = function (col, row, color, frame, overlay) {
		// Since we will move the overlayFrame in which  the current selection is rendered,
		// we clone it to have a reference for the later shifting process.
		this.overlayFrameReference = overlay.clone();
	};
	/** @private */
	ns.BaseSelect.prototype.onSelectionDrag_ = function (col, row, color, frame, overlay) {
		var deltaCol = col - this.lastCol;
		var deltaRow = row - this.lastRow;
		
		var colDiff = col - this.startCol, rowDiff = row - this.startRow;
		
		// Shifting selection on overlay frame:
		this.shiftOverlayFrame_(colDiff, rowDiff, overlay, this.overlayFrameReference);

		// Update selection model:
		$.publish(Events.SELECTION_MOVE_REQUEST, [deltaCol, deltaRow]);

		this.lastCol = col;
		this.lastRow = row;	
	};
	/** @private */
	ns.BaseSelect.prototype.onSelectionDragEnd_ = function (col, row, color, frame, overlay) {
		this.onSelectionDrag_(col, row, color, frame, overlay);
	};


})();
