(function () {
	var ns = $.namespace("pskl.selection");

	
	ns.SelectionManager = function (framesheet) {
		
		this.framesheet = framesheet;
		
		this.currentSelection = null;
	};

	ns.SelectionManager.prototype.init = function () {
		$.subscribe(Events.SELECTION_CREATED, $.proxy(this.onSelectionCreated_, this));
		$.subscribe(Events.SELECTION_DISMISSED, $.proxy(this.onSelectionDismissed_, this));	
		$.subscribe(Events.SELECTION_MOVE_REQUEST, $.proxy(this.onSelectionMoved_, this));
		
		$.subscribe(Events.PASTE, $.proxy(this.onPaste_, this));
		$.subscribe(Events.COPY, $.proxy(this.onCopy_, this));
		$.subscribe(Events.CUT, $.proxy(this.onCut_, this));

		$.subscribe(Events.TOOL_SELECTED, $.proxy(this.onToolSelected_, this)); 
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.cleanSelection_ = function() {
		if(this.currentSelection) {
			this.currentSelection.reset();
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onToolSelected_ = function(evt, tool) {
		var isSelectionTool = tool instanceof pskl.drawingtools.BaseSelect;
		if(!isSelectionTool) {
			this.cleanSelection_();
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onSelectionDismissed_ = function(evt) {
		this.cleanSelection_();
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onCut_ = function(evt) {
		if(this.currentSelection) {
			// Put cut target into the selection:
			this.currentSelection.fillSelectionFromFrame(this.framesheet.getCurrentFrame());

			var pixels = this.currentSelection.pixels;
			var currentFrame = this.framesheet.getCurrentFrame();
			for(var i=0, l=pixels.length; i<l; i++) {
				try {
					currentFrame.setPixel(pixels[i].col, pixels[i].row, Constants.TRANSPARENT_COLOR);
				}
				catch(e) {
					// Catchng out of frame's bound pixels without testing
				}
			}
		}
		else {
			throw "Bad state for CUT callback in SelectionManager";
		}
	};

	ns.SelectionManager.prototype.onPaste_ = function(evt) {
		if(this.currentSelection && this.currentSelection.hasPastedContent) {
			var pixels = this.currentSelection.pixels;
			var currentFrame = this.framesheet.getCurrentFrame();
			for(var i=0, l=pixels.length; i<l; i++) {
				try {
					currentFrame.setPixel(
						pixels[i].col, pixels[i].row, 
						pixels[i].copiedColor);
				}
				catch(e) {
					// Catchng out of frame's bound pixels without testing
				}
			}
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onCopy_ = function(evt) {
		if(this.currentSelection && this.framesheet.getCurrentFrame()) {
			this.currentSelection.fillSelectionFromFrame(this.framesheet.getCurrentFrame());
		}
		else {
			throw "Bad state for CUT callback in SelectionManager";
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onSelectionCreated_ = function(evt, selection) {
		if(selection) {
			this.currentSelection = selection;
		} else {
			throw "No selection set in SelectionManager";
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onSelectionMoved_ = function(evt, colDiff, rowDiff) {
		if(this.currentSelection) {
			this.currentSelection.move(colDiff, rowDiff);
		}
		else {
			throw "Bad state: No currentSelection set when trying to move it in SelectionManager";
		}
	};
})();
