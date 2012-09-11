/*
 * @provide pskl.drawingtools.Select
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Select = function() {
		this.toolId = "tool-select"
		
		// Select's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
	};

	pskl.utils.inherit(ns.Select, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Select.prototype.applyToolAt = function(col, row, color, drawer) {
		this.startCol = col;
		this.startRow = row;
		
		// Drawing the first point of the rectangle in the fake overlay canvas:
		drawer.overlayFrame.setPixel(col, row, color);
	};

	ns.Select.prototype.moveToolAt = function(col, row, color, drawer) {
		// Clean overlay canvas:
		drawer.clearOverlay();

		// When the user moussemove (before releasing), we dynamically compute the 
		// pixel to draw the line and draw this line in the overlay :
		var strokePoints = this.getRectanglePixels_(this.startCol, col, this.startRow, row);
		
		color = Constants.SELECTION_TRANSPARENT_COLOR;
		// Drawing current stroke:
		for(var i = 0; i< strokePoints.length; i++) {

			drawer.overlayFrame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
		}
	};

	/**
	 * @override
	 */
	ns.Select.prototype.releaseToolAt = function(col, row, color, drawer) {		
		drawer.clearOverlay();
		// If the stroke tool is released outside of the canvas, we cancel the stroke: 
		if(drawer.frame.containsPixel(col, row)) {

			
			// Creating horizontal sides of the rectangle:
			var pixels = this.getRectangleSelection(this.startCol, col, this.startRow, row);

			//var strokePoints = this.getRectanglePixels_(this.startCol, col, this.startRow, row);
			
			for(var i = 0; i< pixels.length; i++) {
				// Change model:
				drawer.frame.setPixel(pixels[i].col, pixels[i].row, color);
			}
			// The user released the tool to draw a line. We will compute the pixel coordinate, impact
			// the model and draw them in the drawing canvas (not the fake overlay anymore)		
		}
	};

	ns.Select.prototype.getRectangleSelection = function(x0, x1, y0, y1) {
		
		var pixels = [];
		var swap;
		
		if(x0 > x1) {
			swap = x0;
			x0 = x1;
			x1 = swap;
		}
		if(y0 > y1) {
			swap = y0;
			y0 = y1;
			y1 = swap;
		}

		for(var x = x0; x <= x1; x++) {
			for(var y = y0; y <= y1; y++) {
				pixels.push({"col": x, "row": y});
			}
		}
		
		return pixels;
     };

	/**
	 * Get an array of pixels representing the rectangle.
	 *
	 * @private
	 */
	ns.Select.prototype.getRectanglePixels_ = function(x0, x1, y0, y1) {
		
		var pixels = [];
		var swap;
		
		if(x0 > x1) {
			swap = x0;
			x0 = x1;
			x1 = swap;
		}
		if(y0 > y1) {
			swap = y0;
			y0 = y1;
			y1 = swap;
		}

		// Creating horizontal sides of the rectangle:
		for(var x = x0; x <= x1; x++) {
			pixels.push({"col": x, "row": y0});
			pixels.push({"col": x, "row": y1});
		}

		// Creating vertical sides of the rectangle:
		for(var y = y0; y <= y1; y++) {
			pixels.push({"col": x0, "row": y});
			pixels.push({"col": x1, "row": y});	
		}
		
		return pixels;
     };

})();
