(function () {
	var ns = $.namespace("pskl.selection");

	
	ns.SelectionManager = function (overlayFrame) {
		
		this.overlayFrame = overlayFrame;
		
		this.currentSelection = null;
		this.currentFrame = null; 

		
		$.subscribe(Events.SELECTION_CREATED, $.proxy(this.onSelectionCreated_, this));


		$.subscribe(Events.CURRENT_FRAME_SET, $.proxy(this.onCurrentFrameChanged_, this));

		//$.subscribe(Events.PASTE, $.proxy(this.onPaste_, this));

		$.subscribe(Events.COPY, $.proxy(this.onCopy_, this)););

		$.subscribe(Events.CUT, $.proxy(this.onCut_, this));

		$.subscribe(Events.TOOL_SELECTED); // discard selection if not move

	};

	ns.SelectionManager.prototype.hasSelection = function() {
		return (this.currentSelection == null) ? false : true;
	};

	ns.SelectionManager.prototype.addSelection = function(selection) {
		this.currentSelection = selection;
	};

	ns.SelectionManager.prototype.removeSelection = function(selection) {
		this.currentSelection = null;
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
	ns.SelectionManager.prototype.onCut_ = function(evt) {
		if(this.currentSelection && this.currentFrame) {
			var pixels = this.currentSelection.pixels;
			for(var i=0, l=pixels.length; i<l; i++) {
				this.currentFrame.setPixel(pixels[i].col, pixels[i].row, Constants.TRANSPARENT_COLOR);
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
				this.currentFrame.setPixel(pixels[i].col, pixels[i].row, Constants.TRANSPARENT_COLOR);
			}
		}
		else {
			throw "Bad state for CUT callback in SelectionManager";
		}
	};

	/**
	 * @private
	 */
	ns.SelectionManager.prototype.onCopy_ = function(evt) {
		this.copiedPixels = [];
		if(this.currentSelection && this.currentFrame) {
			var pixels = this.currentSelection.pixels;
			for(var i=0, l=pixels.length; i<l; i++) {
				copiedPixels.push({
					"col": pixels[i].col,
					"row": pixels[i].row,
					"color": this.currentFrame.getPixel(pixels[i].col, pixels[i].row)
				});
			}
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
			throw "Bad current selection set in SelectionManager";
		}
	};
})();
