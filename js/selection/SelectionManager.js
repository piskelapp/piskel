(function () {
	var ns = $.namespace("pskl.selection");

	
	ns.SelectionManager = function (overlayFrame) {
		
		this.overlayFrame = overlayFrame;
		
		this.currentSelection = null;
		this.currentFrame = null; 
		
		$.subscribe(Events.CURRENT_FRAME_SET, $.proxy(this.onCurrentFrameChanged_, this));

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
	ns.SelectionManager.prototype.cleanSelection_ = function(selection) {
		if(this.currentSelection) {
			this.currentSelection.reset();
		}
		this.overlayFrame.clear();
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onCurrentFrameChanged_ = function(evt, currentFrame) {
		if(currentFrame) {
			this.currentFrame = currentFrame;
		}
		else {
			throw "Bad current frame set in SelectionManager";
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onToolSelected_ = function(evt, tool) {
		if(!(tool instanceof pskl.drawingtools.Select)) {
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
		if(this.currentSelection && this.currentFrame) {
			// Put cut target into the selection:
			this.currentSelection.fillSelectionFromFrame(this.currentFrame);

			var pixels = this.currentSelection.pixels;
			for(var i=0, l=pixels.length; i<l; i++) {
				try {
					this.currentFrame.setPixel(pixels[i].col, pixels[i].row, Constants.TRANSPARENT_COLOR);
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
		if(this.currentSelection && this.currentFrame) {
			var pixels = this.currentSelection.pixels;
			for(var i=0, l=pixels.length; i<l; i++) {
				try {
					this.currentFrame.setPixel(
						pixels[i].col, pixels[i].row, 
						pixels[i].copiedColor);
				}
				catch(e) {
					// Catchng out of frame's bound pixels without testing
				}
			}
		}
		else {
			throw "Bad state for PASTE callback in SelectionManager";
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onCopy_ = function(evt) {
		if(this.currentSelection && this.currentFrame) {
			this.currentSelection.fillSelectionFromFrame(this.currentFrame);
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
			var pixels = selection.pixels;
			for(var i=0, l=pixels.length; i<l; i++) {
				this.overlayFrame.setPixel(pixels[i].col, pixels[i].row, Constants.SELECTION_TRANSPARENT_COLOR);
			}
		}
		else {
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
